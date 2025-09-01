import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import * as db from '../services/db';
import { 
    Employee, PpeItem, PpeDeliveryWithDetails, PpeAsset, PpeAssetLog, 
    Incident, Training, Inspection, SafetyEquipment, SafetyInspectionLog, 
    Chemical, WorkPermit, Waste, WasteLog, RespelRecord, Capa, 
    JhaWithSteps, ActivityWithComments, AuditWithFindings, UserProfile, ComplianceRequirement,
    Contractor, ContractorDocument, ContractorEmployee
} from '../types';

interface DataContextState {
    employees: Employee[];
    ppeItems: PpeItem[];
    ppeDeliveries: PpeDeliveryWithDetails[];
    ppeAssets: PpeAsset[];
    ppeAssetLogs: PpeAssetLog[];
    incidents: Incident[];
    trainings: Training[];
    inspections: Inspection[];
    safetyEquipment: SafetyEquipment[];
    safetyInspectionLogs: SafetyInspectionLog[];
    chemicals: Chemical[];
    workPermits: WorkPermit[];
    wastes: Waste[];
    wasteLogs: WasteLog[];
    respelRecords: RespelRecord[];
    capas: Capa[];
    jhas: JhaWithSteps[];
    activities: ActivityWithComments[];
    audits: AuditWithFindings[];
    users: UserProfile[];
    complianceRequirements: ComplianceRequirement[];
    contractors: Contractor[];
    contractorDocuments: ContractorDocument[];
    contractorEmployees: ContractorEmployee[];
    loading: boolean;
    refreshData: () => void;
}

const DataContext = createContext<DataContextState | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

const initialDataState = {
    employees: [], ppeItems: [], ppeDeliveries: [], ppeAssets: [], ppeAssetLogs: [],
    incidents: [], trainings: [], inspections: [], safetyEquipment: [], safetyInspectionLogs: [],
    chemicals: [], workPermits: [], wastes: [], wasteLogs: [], respelRecords: [],
    capas: [], jhas: [], activities: [], audits: [], users: [], complianceRequirements: [],
    contractors: [], contractorDocuments: [], contractorEmployees: []
};


export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Omit<DataContextState, 'loading' | 'refreshData'>>(initialDataState);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [
                employees, ppeItems, ppeDeliveries, ppeAssets, ppeAssetLogs,
                incidents, trainings, inspections, safetyEquipment, safetyInspectionLogs,
                chemicals, workPermits, wastes, wasteLogs, respelRecords,
                capas, jhas, activities, audits, users, complianceRequirements,
                contractors, contractorDocuments, contractorEmployees
            ] = await Promise.all([
                db.getEmployees(), db.getPpeItems(), db.getPpeDeliveries(), db.getPpeAssets(), db.getPpeAssetLogs(),
                db.getIncidents(), db.getTrainings(), db.getInspections(), db.getSafetyEquipment(), db.getSafetyInspectionLogs(),
                db.getChemicals(), db.getWorkPermits(), db.getWastes(), db.getWasteLogs(), db.getRespelRecords(),
                db.getCapas(), db.getJhas(), db.getActivities(), db.getAudits(), db.getUsers(), db.getComplianceRequirements(),
                db.getContractors(), db.getContractorDocuments(), db.getContractorEmployees()
            ]);
            
            setData({
                employees, ppeItems, ppeDeliveries, ppeAssets, ppeAssetLogs,
                incidents, trainings, inspections, safetyEquipment, safetyInspectionLogs,
                chemicals, workPermits, wastes, wasteLogs, respelRecords,
                capas, jhas, activities, audits, users, complianceRequirements,
                contractors, contractorDocuments, contractorEmployees
            });
        } catch (error) {
            console.error("Failed to fetch data for context:", error);
            setData(initialDataState); // Reset on error
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const value: DataContextState = {
        ...data,
        loading,
        refreshData: fetchData,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};