import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
export interface EcrStackProps extends cdk.StackProps {
    tier: string;
    appName: string;
    ecrRepoName: string;
    ecrCountNumber: number;
}
export declare class EcrStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: EcrStackProps);
}
