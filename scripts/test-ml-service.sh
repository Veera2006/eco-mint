#!/bin/bash

# Test script for ML validation service
echo "🧪 Testing Blue Carbon ML Validation Service"
echo "============================================="

# Check if service is running
ML_URL=${ML_SERVICE_URL:-"http://localhost:8000"}

echo "Testing service at: $ML_URL"

# Test 1: Health check
echo -e "\n1️⃣ Health Check"
curl -s "$ML_URL/health" | jq '.'

# Test 2: Service info
echo -e "\n2️⃣ Service Information"
curl -s "$ML_URL/" | jq '.'

# Test 3: Model info
echo -e "\n3️⃣ Model Information"
curl -s "$ML_URL/model-info" | jq '.'

# Test 4: Validate report
echo -e "\n4️⃣ Report Validation Test"
curl -s -X POST "$ML_URL/validate-report" \
  -H "Content-Type: application/json" \
  -d '{
    "report_data": {
      "project_location": "Amazon Rainforest, Brazil",
      "project_type": "tropical_forest",
      "area_hectares": 100.5,
      "tree_species": "Mixed species reforestation",
      "planting_date": "2023-01-15",
      "monitoring_period_months": 24,
      "biomass_data": {
        "above_ground_biomass": 150,
        "tree_count": 5000,
        "average_tree_height": 4.2
      },
      "soil_data": {
        "organic_carbon": 3.2,
        "ph_level": 6.8
      },
      "additional_metrics": {
        "biodiversity_index": 0.8,
        "survival_rate": 0.92
      }
    },
    "file_urls": []
  }' | jq '.'

# Test 5: Edge case - small project
echo -e "\n5️⃣ Small Project Test"
curl -s -X POST "$ML_URL/validate-report" \
  -H "Content-Type: application/json" \
  -d '{
    "report_data": {
      "project_location": "Community Garden, Kenya",
      "project_type": "agroforestry",
      "area_hectares": 0.5,
      "monitoring_period_months": 12,
      "biomass_data": {
        "tree_count": 50
      }
    }
  }' | jq '.'

# Test 6: Edge case - large project
echo -e "\n6️⃣ Large Project Test"
curl -s -X POST "$ML_URL/validate-report" \
  -H "Content-Type: application/json" \
  -d '{
    "report_data": {
      "project_location": "Large Scale Restoration, Indonesia",
      "project_type": "mangrove",
      "area_hectares": 2000,
      "monitoring_period_months": 36,
      "biomass_data": {
        "above_ground_biomass": 300,
        "tree_count": 100000
      }
    }
  }' | jq '.'

echo -e "\n✨ ML Service testing completed!"