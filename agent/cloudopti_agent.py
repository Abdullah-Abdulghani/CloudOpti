#!/usr/bin/env python3
"""
CloudOpti Agent v2.0
Advanced cloud resource monitoring agent with intelligent data collection and Firebase integration.
"""

import psutil
import time
import datetime
import requests
import json
import sys

# ==============================================================================
#                       Firebase Configuration
# ==============================================================================
# استبدل هذا الرابط برابط قاعدة البيانات الخاصة بك
FIREBASE_DATABASE_URL = "https://cloudopti-project-6c2d9-default-rtdb.firebaseio.com/"

# ==============================================================================
#                       Agent Configuration
# ==============================================================================
# Data collection interval in seconds
COLLECTION_INTERVAL_SECONDS = 10

# Cost calculation parameters (simulated pricing )
COST_PER_CPU_UNIT_PER_HOUR = 0.05  # $ per CPU unit per hour
COST_PER_RAM_GB_PER_HOUR = 0.01    # $ per GB RAM per hour

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 2

# ==============================================================================
#                       Utility Functions
# ==============================================================================

def get_resource_usage():
    """
    Collect system resource usage metrics.
    
    Returns:
        Dictionary containing CPU and RAM metrics
    """
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        ram_info = psutil.virtual_memory()
        
        return {
            "cpu_percent": round(cpu_percent, 2),
            "ram_percent": round(ram_info.percent, 2),
            "ram_total_gb": round(ram_info.total / (1024**3), 2),
            "ram_used_gb": round(ram_info.used / (1024**3), 2),
            "ram_available_gb": round(ram_info.available / (1024**3), 2),
        }
    except Exception as e:
        print(f"Error collecting resource usage: {e}")
        return {
            "cpu_percent": 0,
            "ram_percent": 0,
            "ram_total_gb": 0,
            "ram_used_gb": 0,
            "ram_available_gb": 0,
        }

def calculate_simulated_cost(cpu_percent, ram_used_gb):
    """
    Calculate simulated hourly cost based on resource usage.
    
    Args:
        cpu_percent: CPU usage percentage
        ram_used_gb: RAM used in GB
        
    Returns:
        Simulated cost for the collection interval
    """
    # Convert CPU percentage to units (100% = 1 unit)
    cpu_units = cpu_percent / 100.0
    
    # Calculate hourly cost
    cost_per_hour = (cpu_units * COST_PER_CPU_UNIT_PER_HOUR) + \
                    (ram_used_gb * COST_PER_RAM_GB_PER_HOUR)
    
    # Calculate cost for collection interval
    cost_for_interval = cost_per_hour * (COLLECTION_INTERVAL_SECONDS / 3600.0)
    
    return round(cost_for_interval, 6)

def send_data_to_firebase(data):
    """
    Send data to Firebase Realtime Database with retry logic.
    
    Args:
        data: Dictionary containing metrics to send
        
    Returns:
        True if successful, False otherwise
    """
    timestamp_key = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    path = f"/cloud_metrics/{timestamp_key}.json"
    url = f"{FIREBASE_DATABASE_URL}{path}"
    
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.put(url, json=data, timeout=10)
            response.raise_for_status()
            
            print(f"✓ [{timestamp_key}] Data sent successfully (Status: {response.status_code})")
            return True
            
        except requests.exceptions.Timeout:
            print(f"⚠ Attempt {attempt + 1}/{MAX_RETRIES}: Connection timeout")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY_SECONDS)
                
        except requests.exceptions.ConnectionError:
            print(f"⚠ Attempt {attempt + 1}/{MAX_RETRIES}: Connection error")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY_SECONDS)
                
        except requests.exceptions.RequestException as e:
            print(f"✗ Error sending data: {e}")
            return False
    
    print(f"✗ Failed to send data after {MAX_RETRIES} attempts")
    return False

def print_header():
    """Print application header"""
    print("\n" + "="*60)
    print("  CloudOpti Agent v2.0 - Cloud Resource Monitoring")
    print("="*60)
    print(f"Firebase URL: {FIREBASE_DATABASE_URL}")
    print(f"Collection Interval: {COLLECTION_INTERVAL_SECONDS} seconds")
    print(f"Max Retries: {MAX_RETRIES}")
    print("="*60 + "\n")

def print_metrics(data):
    """Pretty print metrics"""
    print(f"CPU: {data['cpu_percent']:6.2f}% | "
          f"RAM: {data['ram_percent']:6.2f}% ({data['ram_used_gb']:.2f}GB) | "
          f"Cost: ${data['simulated_cost_interval']:.6f}")

# ==============================================================================
#                       Main Agent Loop
# ==============================================================================

def main():
    """Main agent loop"""
    print_header()
    
    try:
        iteration = 0
        while True:
            iteration += 1
            
            # Collect metrics
            usage_data = get_resource_usage()
            simulated_cost = calculate_simulated_cost(
                usage_data['cpu_percent'],
                usage_data['ram_used_gb']
            )
            
            # Prepare data for Firebase
            data_to_send = {
                "timestamp": datetime.datetime.now().isoformat(),
                "cpu_percent": usage_data['cpu_percent'],
                "ram_percent": usage_data['ram_percent'],
                "ram_total_gb": usage_data['ram_total_gb'],
                "ram_used_gb": usage_data['ram_used_gb'],
                "ram_available_gb": usage_data['ram_available_gb'],
                "simulated_cost_interval": simulated_cost,
                "estimated_monthly_cost": round(simulated_cost * 3600 * 730, 2),
            }
            
            # Print metrics
            print(f"[Iteration {iteration}] ", end="")
            print_metrics(data_to_send)
            
            # Send to Firebase
            send_data_to_firebase(data_to_send)
            
            # Wait for next collection
            time.sleep(COLLECTION_INTERVAL_SECONDS)
            
    except KeyboardInterrupt:
        print("\n\n" + "="*60)
        print("  Agent stopped by user")
        print("="*60 + "\n")
        sys.exit(0)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()