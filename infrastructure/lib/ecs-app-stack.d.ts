import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
export interface EcsAppStackProps extends cdk.StackProps {
    tier: string;
    appName: string;
    appNamespace: string;
    appService: string;
    appDomain: string;
    vpcId: string;
    subnetIds: string[];
    securityGroupIds: string[];
    clusterArn: string;
    listenerArn: string;
    appRoleArn: string;
    listenerRulePriority: number;
    healthCheckPath: string;
    gracePeriod: number;
    cpu: number;
    memory: number;
    desiredCount: number;
    containerPort: number;
    nonProdSchedule: boolean;
    scheduledMinCapacity: number;
    scheduledMaxCapacity: number;
}
export declare class EcsAppStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: EcsAppStackProps);
}
