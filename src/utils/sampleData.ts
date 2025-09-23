// Sample MRV report data for testing the Blue Carbon platform

export interface SampleMRVReport {
  title: string;
  description: string;
  project_location: string;
  report_data: {
    project_type: string;
    methodology: string;
    monitoring_period: {
      start_date: string;
      end_date: string;
    };
    carbon_pools: {
      above_ground_biomass: number;
      below_ground_biomass: number;
      soil_organic_carbon: number;
      dead_wood: number;
    };
    activity_data: {
      area_hectares: number;
      tree_species: string[];
      planting_density: number;
      survival_rate: number;
    };
    emission_factors: {
      biomass_growth_rate: number;
      carbon_fraction: number;
      root_to_shoot_ratio: number;
    };
    calculations: {
      total_biomass: number;
      carbon_content: number;
      co2_equivalent: number;
    };
    verification: {
      field_measurements: boolean;
      satellite_data: boolean;
      third_party_verification: boolean;
    };
  };
}

export const sampleMRVReports: SampleMRVReport[] = [
  {
    title: "Amazon Rainforest Restoration Project - Phase 1",
    description: "Large-scale reforestation initiative in the Brazilian Amazon covering 1,500 hectares with native species to restore degraded cattle ranching land.",
    project_location: "Acre, Brazil",
    report_data: {
      project_type: "Afforestation/Reforestation",
      methodology: "AR-ACM0003",
      monitoring_period: {
        start_date: "2023-01-01",
        end_date: "2023-12-31"
      },
      carbon_pools: {
        above_ground_biomass: 125.5,
        below_ground_biomass: 31.4,
        soil_organic_carbon: 89.2,
        dead_wood: 12.1
      },
      activity_data: {
        area_hectares: 1500,
        tree_species: ["Cecropia palmata", "Inga edulis", "Swietenia macrophylla", "Bertholletia excelsa"],
        planting_density: 400,
        survival_rate: 0.85
      },
      emission_factors: {
        biomass_growth_rate: 15.2,
        carbon_fraction: 0.47,
        root_to_shoot_ratio: 0.25
      },
      calculations: {
        total_biomass: 258.2,
        carbon_content: 121.4,
        co2_equivalent: 445.1
      },
      verification: {
        field_measurements: true,
        satellite_data: true,
        third_party_verification: true
      }
    }
  },
  {
    title: "Kenya Agroforestry Carbon Initiative",
    description: "Community-based agroforestry project integrating native trees with agricultural crops across 800 smallholder farms.",
    project_location: "Kiambu County, Kenya",
    report_data: {
      project_type: "Agroforestry",
      methodology: "AR-ACM0001",
      monitoring_period: {
        start_date: "2023-06-01",
        end_date: "2024-05-31"
      },
      carbon_pools: {
        above_ground_biomass: 89.3,
        below_ground_biomass: 22.1,
        soil_organic_carbon: 156.7,
        dead_wood: 5.8
      },
      activity_data: {
        area_hectares: 650,
        tree_species: ["Grevillea robusta", "Calliandra calothyrsus", "Leucaena leucocephala"],
        planting_density: 200,
        survival_rate: 0.92
      },
      emission_factors: {
        biomass_growth_rate: 8.5,
        carbon_fraction: 0.45,
        root_to_shoot_ratio: 0.20
      },
      calculations: {
        total_biomass: 273.9,
        carbon_content: 123.3,
        co2_equivalent: 452.1
      },
      verification: {
        field_measurements: true,
        satellite_data: true,
        third_party_verification: false
      }
    }
  },
  {
    title: "Indonesia Mangrove Restoration Program",
    description: "Coastal mangrove restoration project protecting 2,200 hectares of degraded coastal areas and supporting local fishing communities.",
    project_location: "West Java, Indonesia",
    report_data: {
      project_type: "Wetland Restoration",
      methodology: "VM0007",
      monitoring_period: {
        start_date: "2023-03-01",
        end_date: "2024-02-29"
      },
      carbon_pools: {
        above_ground_biomass: 234.6,
        below_ground_biomass: 167.2,
        soil_organic_carbon: 445.8,
        dead_wood: 23.4
      },
      activity_data: {
        area_hectares: 2200,
        tree_species: ["Rhizophora mucronata", "Avicennia marina", "Sonneratia alba"],
        planting_density: 1500,
        survival_rate: 0.78
      },
      emission_factors: {
        biomass_growth_rate: 25.8,
        carbon_fraction: 0.48,
        root_to_shoot_ratio: 0.71
      },
      calculations: {
        total_biomass: 871.0,
        carbon_content: 418.1,
        co2_equivalent: 1533.4
      },
      verification: {
        field_measurements: true,
        satellite_data: true,
        third_party_verification: true
      }
    }
  }
];

export const generateSampleMRVData = (overrides?: Partial<SampleMRVReport>): SampleMRVReport => {
  const baseReport = sampleMRVReports[Math.floor(Math.random() * sampleMRVReports.length)];
  
  return {
    ...baseReport,
    ...overrides,
    report_data: {
      ...baseReport.report_data,
      ...(overrides?.report_data || {})
    }
  };
};

// Sample governance approver data
export const sampleGovernanceApprovers = [
  {
    full_name: "Dr. Maria Santos",
    organization: "Amazon Conservation NGO",
    role: "ngo" as const,
    email: "maria.santos@amazonconservation.org"
  },
  {
    full_name: "James Kinyua",
    organization: "Kenya Forest Service",
    role: "ngo" as const,
    email: "j.kinyua@kenyaforest.gov.ke"
  },
  {
    full_name: "Dr. Siti Rahayu",
    organization: "Indonesian Mangrove Foundation",
    role: "ngo" as const,
    email: "siti.rahayu@mangrove.id"
  }
];

// Sample blockchain contract addresses for different networks
export const sampleContractAddresses = {
  polygon_mumbai: "0x742d35Cc7bF58E06B14e2A6A5C6e75e2A86c1c63",
  polygon_mainnet: "0x1234567890123456789012345678901234567890",
  ethereum_sepolia: "0x0987654321098765432109876543210987654321"
};

// Helper function to generate random transaction hash
export const generateMockTransactionHash = (): string => {
  return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

// Helper function to generate random block number
export const generateMockBlockNumber = (): number => {
  return Math.floor(Math.random() * 1000000 + 18000000);
};