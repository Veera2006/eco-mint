from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
import numpy as np
import pandas as pd
import joblib
import logging
from datetime import datetime
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Blue Carbon ML Validation Service",
    description="AI-powered validation service for MRV reports",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class MRVReport(BaseModel):
    project_location: str
    project_type: str
    area_hectares: float
    tree_species: Optional[str] = None
    planting_date: Optional[str] = None
    monitoring_period_months: int
    biomass_data: Dict[str, Any]
    soil_data: Optional[Dict[str, Any]] = None
    additional_metrics: Optional[Dict[str, Any]] = None

class ValidationRequest(BaseModel):
    report_data: MRVReport
    file_urls: Optional[list] = []

class ValidationResponse(BaseModel):
    status: str  # "validated" or "anomaly"
    estimated_sequestration: float
    confidence_score: float
    validation_notes: str
    detailed_analysis: Dict[str, Any]

# Mock ML Model Class
class CarbonSequestrationValidator:
    def __init__(self):
        self.model_loaded = False
        self.load_model()
    
    def load_model(self):
        """
        In production, load your trained XGBoost/PyTorch model here
        """
        try:
            # Mock model loading - replace with actual model
            # self.model = joblib.load('carbon_model.pkl')
            # self.scaler = joblib.load('feature_scaler.pkl')
            
            # For demo, use rule-based validation
            self.validation_rules = {
                'min_area': 0.1,  # hectares
                'max_area': 10000,  # hectares
                'min_monitoring_period': 6,  # months
                'max_monitoring_period': 120,  # months
                'sequestration_factors': {
                    'tropical_forest': 15.0,  # tons CO2/hectare/year
                    'mangrove': 25.0,
                    'agroforestry': 8.0,
                    'grassland': 3.0,
                    'default': 10.0
                }
            }
            
            self.model_loaded = True
            logger.info("ML Model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load ML model: {e}")
            self.model_loaded = False
    
    def validate_report(self, report_data: MRVReport) -> ValidationResponse:
        """
        Validate MRV report and estimate carbon sequestration
        """
        try:
            # Basic data validation
            validation_errors = self._validate_basic_data(report_data)
            if validation_errors:
                return ValidationResponse(
                    status="anomaly",
                    estimated_sequestration=0.0,
                    confidence_score=0.0,
                    validation_notes=f"Data validation failed: {'; '.join(validation_errors)}",
                    detailed_analysis={"errors": validation_errors}
                )
            
            # Calculate estimated sequestration
            estimated_sequestration = self._calculate_sequestration(report_data)
            
            # Anomaly detection
            anomaly_score = self._detect_anomalies(report_data, estimated_sequestration)
            
            # Confidence scoring
            confidence_score = self._calculate_confidence(report_data, anomaly_score)
            
            # Determine status
            status = "validated" if anomaly_score < 0.3 and confidence_score > 0.6 else "anomaly"
            
            # Generate validation notes
            validation_notes = self._generate_validation_notes(
                report_data, estimated_sequestration, anomaly_score, confidence_score
            )
            
            # Detailed analysis
            detailed_analysis = {
                "anomaly_score": float(anomaly_score),
                "sequestration_per_hectare": float(estimated_sequestration / report_data.area_hectares),
                "project_type_factor": self.validation_rules['sequestration_factors'].get(
                    report_data.project_type, 
                    self.validation_rules['sequestration_factors']['default']
                ),
                "monitoring_duration_years": report_data.monitoring_period_months / 12,
                "timestamp": datetime.now().isoformat()
            }
            
            return ValidationResponse(
                status=status,
                estimated_sequestration=round(estimated_sequestration, 2),
                confidence_score=round(confidence_score, 2),
                validation_notes=validation_notes,
                detailed_analysis=detailed_analysis
            )
            
        except Exception as e:
            logger.error(f"Validation error: {e}")
            raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")
    
    def _validate_basic_data(self, report_data: MRVReport) -> list:
        """Basic data validation checks"""
        errors = []
        
        if report_data.area_hectares < self.validation_rules['min_area']:
            errors.append(f"Area too small: {report_data.area_hectares} hectares")
        
        if report_data.area_hectares > self.validation_rules['max_area']:
            errors.append(f"Area too large: {report_data.area_hectares} hectares")
        
        if report_data.monitoring_period_months < self.validation_rules['min_monitoring_period']:
            errors.append(f"Monitoring period too short: {report_data.monitoring_period_months} months")
        
        if not report_data.biomass_data:
            errors.append("Missing biomass data")
        
        return errors
    
    def _calculate_sequestration(self, report_data: MRVReport) -> float:
        """Calculate estimated carbon sequestration"""
        # Get sequestration factor for project type
        factor = self.validation_rules['sequestration_factors'].get(
            report_data.project_type,
            self.validation_rules['sequestration_factors']['default']
        )
        
        # Calculate annual sequestration rate
        monitoring_years = report_data.monitoring_period_months / 12
        annual_sequestration = report_data.area_hectares * factor
        
        # Total sequestration over monitoring period
        total_sequestration = annual_sequestration * monitoring_years
        
        # Apply biomass data adjustment if available
        if report_data.biomass_data:
            biomass_factor = self._calculate_biomass_factor(report_data.biomass_data)
            total_sequestration *= biomass_factor
        
        return max(0, total_sequestration)
    
    def _calculate_biomass_factor(self, biomass_data: Dict[str, Any]) -> float:
        """Calculate adjustment factor based on biomass data"""
        # Mock biomass analysis - replace with actual model
        try:
            if 'above_ground_biomass' in biomass_data:
                agb = biomass_data['above_ground_biomass']
                # Normalize around expected values
                if isinstance(agb, (int, float)) and agb > 0:
                    return min(2.0, max(0.5, agb / 100))  # Simple scaling
            
            if 'tree_count' in biomass_data:
                tree_count = biomass_data['tree_count']
                if isinstance(tree_count, (int, float)) and tree_count > 0:
                    return min(1.5, max(0.7, tree_count / 1000))  # Trees per hectare factor
                    
        except Exception as e:
            logger.warning(f"Biomass factor calculation error: {e}")
        
        return 1.0  # Default factor
    
    def _detect_anomalies(self, report_data: MRVReport, estimated_sequestration: float) -> float:
        """Detect anomalies in the report data"""
        anomaly_scores = []
        
        # Check sequestration rate per hectare
        seq_per_hectare = estimated_sequestration / report_data.area_hectares
        expected_max = self.validation_rules['sequestration_factors'].get(
            report_data.project_type, 
            self.validation_rules['sequestration_factors']['default']
        ) * 2  # Allow 2x expected max
        
        if seq_per_hectare > expected_max:
            anomaly_scores.append(0.8)  # High anomaly
        elif seq_per_hectare > expected_max * 0.7:
            anomaly_scores.append(0.4)  # Medium anomaly
        else:
            anomaly_scores.append(0.1)  # Low anomaly
        
        # Check monitoring period reasonableness
        if report_data.monitoring_period_months > 60:  # > 5 years
            anomaly_scores.append(0.3)
        elif report_data.monitoring_period_months < 12:  # < 1 year
            anomaly_scores.append(0.5)
        else:
            anomaly_scores.append(0.1)
        
        # Check area reasonableness
        if report_data.area_hectares > 1000:  # Very large project
            anomaly_scores.append(0.4)
        elif report_data.area_hectares < 1:  # Very small project
            anomaly_scores.append(0.3)
        else:
            anomaly_scores.append(0.1)
        
        return np.mean(anomaly_scores)
    
    def _calculate_confidence(self, report_data: MRVReport, anomaly_score: float) -> float:
        """Calculate confidence score for the validation"""
        confidence_factors = []
        
        # Data completeness factor
        completeness = 0.5  # Base score
        if report_data.biomass_data:
            completeness += 0.2
        if report_data.soil_data:
            completeness += 0.15
        if report_data.tree_species:
            completeness += 0.1
        if report_data.additional_metrics:
            completeness += 0.05
        
        confidence_factors.append(min(1.0, completeness))
        
        # Anomaly factor (inverse relationship)
        anomaly_factor = max(0.0, 1.0 - anomaly_score)
        confidence_factors.append(anomaly_factor)
        
        # Monitoring period factor
        if 12 <= report_data.monitoring_period_months <= 36:
            period_factor = 1.0
        elif 6 <= report_data.monitoring_period_months < 12:
            period_factor = 0.7
        elif 36 < report_data.monitoring_period_months <= 60:
            period_factor = 0.8
        else:
            period_factor = 0.5
        
        confidence_factors.append(period_factor)
        
        return np.mean(confidence_factors)
    
    def _generate_validation_notes(self, report_data: MRVReport, sequestration: float, 
                                 anomaly_score: float, confidence_score: float) -> str:
        """Generate human-readable validation notes"""
        notes = []
        
        # Overall assessment
        if anomaly_score < 0.2 and confidence_score > 0.8:
            notes.append("High-quality report with reliable data.")
        elif anomaly_score < 0.3 and confidence_score > 0.6:
            notes.append("Good quality report with acceptable confidence.")
        else:
            notes.append("Report requires additional review due to anomalies or low confidence.")
        
        # Specific observations
        seq_per_hectare = sequestration / report_data.area_hectares
        notes.append(f"Estimated sequestration: {seq_per_hectare:.1f} tons CO2/hectare.")
        
        if report_data.monitoring_period_months < 12:
            notes.append("Short monitoring period may affect accuracy.")
        elif report_data.monitoring_period_months > 36:
            notes.append("Extended monitoring period provides good data reliability.")
        
        if not report_data.soil_data:
            notes.append("Consider including soil carbon measurements for improved accuracy.")
        
        return " ".join(notes)

# Initialize the validator
validator = CarbonSequestrationValidator()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Blue Carbon ML Validation Service",
        "status": "operational",
        "model_loaded": validator.model_loaded,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy" if validator.model_loaded else "degraded",
        "model_loaded": validator.model_loaded,
        "service_version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/validate-report", response_model=ValidationResponse)
async def validate_report(request: ValidationRequest):
    """
    Validate MRV report and estimate carbon sequestration
    """
    logger.info(f"Received validation request for project: {request.report_data.project_location}")
    
    if not validator.model_loaded:
        raise HTTPException(
            status_code=503, 
            detail="ML model not available. Service temporarily unavailable."
        )
    
    try:
        result = validator.validate_report(request.report_data)
        logger.info(f"Validation completed: {result.status}, {result.estimated_sequestration} tons CO2")
        return result
        
    except Exception as e:
        logger.error(f"Validation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

@app.get("/model-info")
async def get_model_info():
    """Get information about the loaded model"""
    return {
        "model_type": "Rule-based with ML validation",
        "model_loaded": validator.model_loaded,
        "supported_project_types": list(validator.validation_rules['sequestration_factors'].keys()),
        "validation_rules": validator.validation_rules
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)