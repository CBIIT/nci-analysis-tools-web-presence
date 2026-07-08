"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EcsAppStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ecs = __importStar(require("aws-cdk-lib/aws-ecs"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const elbv2 = __importStar(require("aws-cdk-lib/aws-elasticloadbalancingv2"));
const ssm = __importStar(require("aws-cdk-lib/aws-ssm"));
const appscaling = __importStar(require("aws-cdk-lib/aws-applicationautoscaling"));
class EcsAppStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const { tier, appName, appNamespace, appService, appDomain, vpcId, subnetIds, securityGroupIds, clusterArn, listenerArn, appRoleArn, listenerRulePriority, healthCheckPath, gracePeriod, } = props;
        // Stack-level tags
        cdk.Tags.of(this).add("EnvironmentTier", tier);
        cdk.Tags.of(this).add("ResourceName", `${tier}-${appName}`);
        cdk.Tags.of(this).add("ManagedBy", "cdk");
        cdk.Tags.of(this).add("CreatedBy", "cdk");
        cdk.Tags.of(this).add("Project", "dceg-analysistools");
        cdk.Tags.of(this).add("ApplicationName", appName);
        // Import existing shared resources
        const vpc = ec2.Vpc.fromLookup(this, "Vpc", { vpcId });
        const subnets = subnetIds.map((sid, i) => ec2.Subnet.fromSubnetId(this, `Subnet${i}`, sid));
        const securityGroups = securityGroupIds.map((sgId, i) => ec2.SecurityGroup.fromSecurityGroupId(this, `SG${i}`, sgId));
        const clusterName = cdk.Arn.split(clusterArn, cdk.ArnFormat.SLASH_RESOURCE_NAME).resourceName;
        const cluster = ecs.Cluster.fromClusterAttributes(this, "Cluster", {
            clusterName,
            clusterArn,
            vpc,
            securityGroups,
        });
        const executionRole = iam.Role.fromRoleArn(this, "ExecutionRole", appRoleArn);
        const taskRole = iam.Role.fromRoleArn(this, "TaskRole", appRoleArn);
        const listener = elbv2.ApplicationListener.fromApplicationListenerAttributes(this, "Listener", {
            listenerArn,
            securityGroup: securityGroups[0],
        });
        // CloudWatch log group
        const logGroup = new logs.LogGroup(this, "WebLogGroup", {
            logGroupName: `/${appNamespace}/${tier}/${appName}/web`,
            retention: logs.RetentionDays.SIX_MONTHS,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        // Task definition
        const taskDef = new ecs.FargateTaskDefinition(this, "WebTaskDef", {
            family: `${tier}-${appName}-${appService}`,
            cpu: props.cpu,
            memoryLimitMiB: props.memory,
            executionRole,
            taskRole,
        });
        taskDef.addContainer("WebContainer", {
            containerName: "frontend",
            image: ecs.ContainerImage.fromRegistry("nginx:alpine"),
            essential: true,
            portMappings: [
                {
                    containerPort: props.containerPort,
                    hostPort: props.containerPort,
                    protocol: ecs.Protocol.TCP,
                },
            ],
            logging: ecs.LogDrivers.awsLogs({
                logGroup,
                streamPrefix: "frontend",
            }),
        });
        // Target group
        const tg = new elbv2.ApplicationTargetGroup(this, "WebTG", {
            targetGroupName: `${tier}-${appName}-${appService}`,
            port: 80,
            protocol: elbv2.ApplicationProtocol.HTTP,
            targetType: elbv2.TargetType.IP,
            vpc,
            healthCheck: {
                enabled: true,
                path: healthCheckPath,
                port: "80",
            },
        });
        // ALB listener rule
        listener.addTargetGroups("WebListenerRule", {
            targetGroups: [tg],
            conditions: [
                elbv2.ListenerCondition.hostHeaders([appDomain]),
                elbv2.ListenerCondition.pathPatterns(["/*"]),
            ],
            priority: listenerRulePriority,
        });
        // Fargate service
        const service = new ecs.FargateService(this, "WebService", {
            serviceName: `${tier}-${appName}-${appService}`,
            cluster,
            taskDefinition: taskDef,
            desiredCount: props.desiredCount,
            securityGroups,
            vpcSubnets: { subnets },
            assignPublicIp: false,
            enableECSManagedTags: true,
            enableExecuteCommand: true,
            circuitBreaker: { rollback: true },
            healthCheckGracePeriod: cdk.Duration.seconds(gracePeriod),
            propagateTags: ecs.PropagatedTagSource.TASK_DEFINITION,
        });
        service.attachToApplicationTargetGroup(tg);
        // Prevent CDK from reverting task definitions registered by deploy-app workflow
        const cfnService = service.node.defaultChild;
        cfnService.addPropertyOverride("TaskDefinition", `${tier}-${appName}-${appService}`);
        cfnService.addPropertyDeletionOverride("DesiredCount");
        // Scheduled auto-scaling (non-prod: scale to 0 nights/weekends)
        if (props.nonProdSchedule) {
            const scalable = service.autoScaleTaskCount({
                minCapacity: 0,
                maxCapacity: props.scheduledMaxCapacity,
            });
            scalable.scaleOnSchedule("ScaleOut", {
                schedule: appscaling.Schedule.cron({
                    hour: "7",
                    minute: "0",
                    weekDay: "MON-FRI",
                }),
                minCapacity: props.scheduledMinCapacity,
                maxCapacity: props.scheduledMaxCapacity,
                timeZone: cdk.TimeZone.AMERICA_NEW_YORK,
            });
            scalable.scaleOnSchedule("ScaleIn", {
                schedule: appscaling.Schedule.cron({
                    hour: "19",
                    minute: "0",
                    weekDay: "MON-FRI",
                }),
                minCapacity: 0,
                maxCapacity: 0,
                timeZone: cdk.TimeZone.AMERICA_NEW_YORK,
            });
        }
        // SSM parameters for deploy-app workflow
        new ssm.StringParameter(this, "SsmEcsCluster", {
            parameterName: `/${appNamespace}/${tier}/${appName}/ecs_cluster`,
            stringValue: clusterName,
        });
        new ssm.StringParameter(this, "SsmEcsWebTask", {
            parameterName: `/${appNamespace}/${tier}/${appName}/ecs_web_task`,
            stringValue: `${tier}-${appName}-${appService}`,
        });
        new ssm.StringParameter(this, "SsmEcsWebService", {
            parameterName: `/${appNamespace}/${tier}/${appName}/ecs_web_service`,
            stringValue: `${tier}-${appName}-${appService}`,
        });
        new ssm.StringParameter(this, "SsmRoleArn", {
            parameterName: `/${appNamespace}/${tier}/${appName}/role_arn`,
            stringValue: appRoleArn,
        });
        // Stack outputs
        new cdk.CfnOutput(this, "WebServiceName", {
            value: service.serviceName,
            description: "ECS Service Name",
        });
        new cdk.CfnOutput(this, "WebTaskDefArn", {
            value: taskDef.taskDefinitionArn,
            description: "Task Definition ARN",
        });
        new cdk.CfnOutput(this, "TargetGroupArn", {
            value: tg.targetGroupArn,
            description: "Target Group ARN",
        });
    }
}
exports.EcsAppStack = EcsAppStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWNzLWFwcC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVjcy1hcHAtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLHlEQUEyQztBQUMzQyx5REFBMkM7QUFDM0MseURBQTJDO0FBQzNDLDJEQUE2QztBQUM3Qyw4RUFBZ0U7QUFDaEUseURBQTJDO0FBQzNDLG1GQUFxRTtBQStCckUsTUFBYSxXQUFZLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDeEMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUF1QjtRQUMvRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLEVBQ0osSUFBSSxFQUNKLE9BQU8sRUFDUCxZQUFZLEVBQ1osVUFBVSxFQUNWLFNBQVMsRUFDVCxLQUFLLEVBQ0wsU0FBUyxFQUNULGdCQUFnQixFQUNoQixVQUFVLEVBQ1YsV0FBVyxFQUNYLFVBQVUsRUFDVixvQkFBb0IsRUFDcEIsZUFBZSxFQUNmLFdBQVcsR0FDWixHQUFHLEtBQUssQ0FBQztRQUVWLG1CQUFtQjtRQUNuQixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDL0MsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxHQUFHLElBQUksSUFBSSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQzVELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDMUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxD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LENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQzFDLGFBQWEsRUFBRSxJQUFJLFlBQVksSUFBSSxJQUFJLElBQUksT0FBTyxXQUFXO1lBQzdELFdBQVcsRUFBRSxVQUFVO1NBQ3hCLENBQUMsQ0FBQztRQUVILGdCQUFnQjtRQUNoQixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1lBQ3hDLEtBQUssRUFBRSxPQUFPLENBQUMsV0FBVztZQUMxQixXQUFXLEVBQUUsa0JBQWtCO1NBQ2hDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ3ZDLEtBQUssRUFBRSxPQUFPLENBQUMsaUJBQWlCO1lBQ2hDLFdBQVcsRUFBRSxxQkFBcUI7U0FDbkMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUN4QyxLQUFLLEVBQUUsRUFBRSxDQUFDLGNBQWM7WUFDeEIsV0FBVyxFQUFFLGtCQUFrQjtTQUNoQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFyTkQsa0NBcU5DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gXCJhd3MtY2RrLWxpYlwiO1xuaW1wb3J0ICogYXMgZWNzIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZWNzXCI7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSBcImF3cy1jZGstbGliL2F3cy1lYzJcIjtcbmltcG9ydCAqIGFzIGlhbSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWlhbVwiO1xuaW1wb3J0ICogYXMgbG9ncyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWxvZ3NcIjtcbmltcG9ydCAqIGFzIGVsYnYyIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZWxhc3RpY2xvYWRiYWxhbmNpbmd2MlwiO1xuaW1wb3J0ICogYXMgc3NtIGZyb20gXCJhd3MtY2RrLWxpYi9hd3Mtc3NtXCI7XG5pbXBvcnQgKiBhcyBhcHBzY2FsaW5nIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtYXBwbGljYXRpb25hdXRvc2NhbGluZ1wiO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBFY3NBcHBTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICB0aWVyOiBzdHJpbmc7XG4gIGFwcE5hbWU6IHN0cmluZztcbiAgYXBwTmFtZXNwYWNlOiBzdHJpbmc7XG4gIGFwcFNlcnZpY2U6IHN0cmluZztcbiAgYXBwRG9tYWluOiBzdHJpbmc7XG5cbiAgdnBjSWQ6IHN0cmluZztcbiAgc3VibmV0SWRzOiBzdHJpbmdbXTtcbiAgc2VjdXJpdHlHcm91cElkczogc3RyaW5nW107XG4gIGNsdXN0ZXJBcm46IHN0cmluZztcbiAgbGlzdGVuZXJBcm46IHN0cmluZztcbiAgYXBwUm9sZUFybjogc3RyaW5nO1xuXG4gIGxpc3RlbmVyUnVsZVByaW9yaXR5OiBudW1iZXI7XG4gIGhlYWx0aENoZWNrUGF0aDogc3RyaW5nO1xuICBncmFjZVBlcmlvZDogbnVtYmVyO1xuXG4gIGNwdTogbnVtYmVyO1xuICBtZW1vcnk6IG51bWJlcjtcbiAgZGVzaXJlZENvdW50OiBudW1iZXI7XG4gIGNvbnRhaW5lclBvcnQ6IG51bWJlcjtcblxuICBub25Qcm9kU2NoZWR1bGU6IGJvb2xlYW47XG4gIHNjaGVkdWxlZE1pbkNhcGFjaXR5OiBudW1iZXI7XG4gIHNjaGVkdWxlZE1heENhcGFjaXR5OiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBFY3NBcHBTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBFY3NBcHBTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCB7XG4gICAgICB0aWVyLFxuICAgICAgYXBwTmFtZSxcbiAgICAgIGFwcE5hbWVzcGFjZSxcbiAgICAgIGFwcFNlcnZpY2UsXG4gICAgICBhcHBEb21haW4sXG4gICAgICB2cGNJZCxcbiAgICAgIHN1Ym5ldElkcyxcbiAgICAgIHNlY3VyaXR5R3JvdXBJZHMsXG4gICAgICBjbHVzdGVyQXJuLFxuICAgICAgbGlzdGVuZXJBcm4sXG4gICAgICBhcHBSb2xlQXJuLFxuICAgICAgbGlzdGVuZXJSdWxlUHJpb3JpdHksXG4gICAgICBoZWFsdGhDaGVja1BhdGgsXG4gICAgICBncmFjZVBlcmlvZCxcbiAgICB9ID0gcHJvcHM7XG5cbiAgICAvLyBTdGFjay1sZXZlbCB0YWdzXG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKFwiRW52aXJvbm1lbnRUaWVyXCIsIHRpZXIpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZChcIlJlc291cmNlTmFtZVwiLCBgJHt0aWVyfS0ke2FwcE5hbWV9YCk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKFwiTWFuYWdlZEJ5XCIsIFwiY2RrXCIpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZChcIkNyZWF0ZWRCeVwiLCBcImNka1wiKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoXCJQcm9qZWN0XCIsIFwiZGNlZy1hbmFseXNpc3Rvb2xzXCIpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZChcIkFwcGxpY2F0aW9uTmFtZVwiLCBhcHBOYW1lKTtcblxuICAgIC8vIEltcG9ydCBleGlzdGluZyBzaGFyZWQgcmVzb3VyY2VzXG4gICAgY29uc3QgdnBjID0gZWMyLlZwYy5mcm9tTG9va3VwKHRoaXMsIFwiVnBjXCIsIHsgdnBjSWQgfSk7XG5cbiAgICBjb25zdCBzdWJuZXRzID0gc3VibmV0SWRzLm1hcCgoc2lkLCBpKSA9PlxuICAgICAgZWMyLlN1Ym5ldC5mcm9tU3VibmV0SWQodGhpcywgYFN1Ym5ldCR7aX1gLCBzaWQpXG4gICAgKTtcblxuICAgIGNvbnN0IHNlY3VyaXR5R3JvdXBzID0gc2VjdXJpdHlHcm91cElkcy5tYXAoKHNnSWQsIGkpID0+XG4gICAgICBlYzIuU2VjdXJpdHlHcm91cC5mcm9tU2VjdXJpdHlHcm91cElkKHRoaXMsIGBTRyR7aX1gLCBzZ0lkKVxuICAgICk7XG5cbiAgICBjb25zdCBjbHVzdGVyTmFtZSA9IGNkay5Bcm4uc3BsaXQoXG4gICAgICBjbHVzdGVyQXJuLFxuICAgICAgY2RrLkFybkZvcm1hdC5TTEFTSF9SRVNPVVJDRV9OQU1FXG4gICAgKS5yZXNvdXJjZU5hbWUhO1xuICAgIGNvbnN0IGNsdXN0ZXIgPSBlY3MuQ2x1c3Rlci5mcm9tQ2x1c3RlckF0dHJpYnV0ZXModGhpcywgXCJDbHVzdGVyXCIsIHtcbiAgICAgIGNsdXN0ZXJOYW1lLFxuICAgICAgY2x1c3RlckFybixcbiAgICAgIHZwYyxcbiAgICAgIHNlY3VyaXR5R3JvdXBzLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZXhlY3V0aW9uUm9sZSA9IGlhbS5Sb2xlLmZyb21Sb2xlQXJuKHRoaXMsIFwiRXhlY3V0aW9uUm9sZVwiLCBhcHBSb2xlQXJuKTtcbiAgICBjb25zdCB0YXNrUm9sZSA9IGlhbS5Sb2xlLmZyb21Sb2xlQXJuKHRoaXMsIFwiVGFza1JvbGVcIiwgYXBwUm9sZUFybik7XG5cbiAgICBjb25zdCBsaXN0ZW5lciA9IGVsYnYyLkFwcGxpY2F0aW9uTGlzdGVuZXIuZnJvbUFwcGxpY2F0aW9uTGlzdGVuZXJBdHRyaWJ1dGVzKFxuICAgICAgdGhpcyxcbiAgICAgIFwiTGlzdGVuZXJcIixcbiAgICAgIHtcbiAgICAgICAgbGlzdGVuZXJBcm4sXG4gICAgICAgIHNlY3VyaXR5R3JvdXA6IHNlY3VyaXR5R3JvdXBzWzBdLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBDbG91ZFdhdGNoIGxvZyBncm91cFxuICAgIGNvbnN0IGxvZ0dyb3VwID0gbmV3IGxvZ3MuTG9nR3JvdXAodGhpcywgXCJXZWJMb2dHcm91cFwiLCB7XG4gICAgICBsb2dHcm91cE5hbWU6IGAvJHthcHBOYW1lc3BhY2V9LyR7dGllcn0vJHthcHBOYW1lfS93ZWJgLFxuICAgICAgcmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuU0lYX01PTlRIUyxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgfSk7XG5cbiAgICAvLyBUYXNrIGRlZmluaXRpb25cbiAgICBjb25zdCB0YXNrRGVmID0gbmV3IGVjcy5GYXJnYXRlVGFza0RlZmluaXRpb24odGhpcywgXCJXZWJUYXNrRGVmXCIsIHtcbiAgICAgIGZhbWlseTogYCR7dGllcn0tJHthcHBOYW1lfS0ke2FwcFNlcnZpY2V9YCxcbiAgICAgIGNwdTogcHJvcHMuY3B1LFxuICAgICAgbWVtb3J5TGltaXRNaUI6IHByb3BzLm1lbW9yeSxcbiAgICAgIGV4ZWN1dGlvblJvbGUsXG4gICAgICB0YXNrUm9sZSxcbiAgICB9KTtcblxuICAgIHRhc2tEZWYuYWRkQ29udGFpbmVyKFwiV2ViQ29udGFpbmVyXCIsIHtcbiAgICAgIGNvbnRhaW5lck5hbWU6IFwiZnJvbnRlbmRcIixcbiAgICAgIGltYWdlOiBlY3MuQ29udGFpbmVySW1hZ2UuZnJvbVJlZ2lzdHJ5KFwibmdpbng6YWxwaW5lXCIpLFxuICAgICAgZXNzZW50aWFsOiB0cnVlLFxuICAgICAgcG9ydE1hcHBpbmdzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBjb250YWluZXJQb3J0OiBwcm9wcy5jb250YWluZXJQb3J0LFxuICAgICAgICAgIGhvc3RQb3J0OiBwcm9wcy5jb250YWluZXJQb3J0LFxuICAgICAgICAgIHByb3RvY29sOiBlY3MuUHJvdG9jb2wuVENQLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIGxvZ2dpbmc6IGVjcy5Mb2dEcml2ZXJzLmF3c0xvZ3Moe1xuICAgICAgICBsb2dHcm91cCxcbiAgICAgICAgc3RyZWFtUHJlZml4OiBcImZyb250ZW5kXCIsXG4gICAgICB9KSxcbiAgICB9KTtcblxuICAgIC8vIFRhcmdldCBncm91cFxuICAgIGNvbnN0IHRnID0gbmV3IGVsYnYyLkFwcGxpY2F0aW9uVGFyZ2V0R3JvdXAodGhpcywgXCJXZWJUR1wiLCB7XG4gICAgICB0YXJnZXRHcm91cE5hbWU6IGAke3RpZXJ9LSR7YXBwTmFtZX0tJHthcHBTZXJ2aWNlfWAsXG4gICAgICBwb3J0OiA4MCxcbiAgICAgIHByb3RvY29sOiBlbGJ2Mi5BcHBsaWNhdGlvblByb3RvY29sLkhUVFAsXG4gICAgICB0YXJnZXRUeXBlOiBlbGJ2Mi5UYXJnZXRUeXBlLklQLFxuICAgICAgdnBjLFxuICAgICAgaGVhbHRoQ2hlY2s6IHtcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgcGF0aDogaGVhbHRoQ2hlY2tQYXRoLFxuICAgICAgICBwb3J0OiBcIjgwXCIsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gQUxCIGxpc3RlbmVyIHJ1bGVcbiAgICBsaXN0ZW5lci5hZGRUYXJnZXRHcm91cHMoXCJXZWJMaXN0ZW5lclJ1bGVcIiwge1xuICAgICAgdGFyZ2V0R3JvdXBzOiBbdGddLFxuICAgICAgY29uZGl0aW9uczogW1xuICAgICAgICBlbGJ2Mi5MaXN0ZW5lckNvbmRpdGlvbi5ob3N0SGVhZGVycyhbYXBwRG9tYWluXSksXG4gICAgICAgIGVsYnYyLkxpc3RlbmVyQ29uZGl0aW9uLnBhdGhQYXR0ZXJucyhbXCIvKlwiXSksXG4gICAgICBdLFxuICAgICAgcHJpb3JpdHk6IGxpc3RlbmVyUnVsZVByaW9yaXR5LFxuICAgIH0pO1xuXG4gICAgLy8gRmFyZ2F0ZSBzZXJ2aWNlXG4gICAgY29uc3Qgc2VydmljZSA9IG5ldyBlY3MuRmFyZ2F0ZVNlcnZpY2UodGhpcywgXCJXZWJTZXJ2aWNlXCIsIHtcbiAgICAgIHNlcnZpY2VOYW1lOiBgJHt0aWVyfS0ke2FwcE5hbWV9LSR7YXBwU2VydmljZX1gLFxuICAgICAgY2x1c3RlcixcbiAgICAgIHRhc2tEZWZpbml0aW9uOiB0YXNrRGVmLFxuICAgICAgZGVzaXJlZENvdW50OiBwcm9wcy5kZXNpcmVkQ291bnQsXG4gICAgICBzZWN1cml0eUdyb3VwcyxcbiAgICAgIHZwY1N1Ym5ldHM6IHsgc3VibmV0cyB9LFxuICAgICAgYXNzaWduUHVibGljSXA6IGZhbHNlLFxuICAgICAgZW5hYmxlRUNTTWFuYWdlZFRhZ3M6IHRydWUsXG4gICAgICBlbmFibGVFeGVjdXRlQ29tbWFuZDogdHJ1ZSxcbiAgICAgIGNpcmN1aXRCcmVha2VyOiB7IHJvbGxiYWNrOiB0cnVlIH0sXG4gICAgICBoZWFsdGhDaGVja0dyYWNlUGVyaW9kOiBjZGsuRHVyYXRpb24uc2Vjb25kcyhncmFjZVBlcmlvZCksXG4gICAgICBwcm9wYWdhdGVUYWdzOiBlY3MuUHJvcGFnYXRlZFRhZ1NvdXJjZS5UQVNLX0RFRklOSVRJT04sXG4gICAgfSk7XG5cbiAgICBzZXJ2aWNlLmF0dGFjaFRvQXBwbGljYXRpb25UYXJnZXRHcm91cCh0Zyk7XG5cbiAgICAvLyBQcmV2ZW50IENESyBmcm9tIHJldmVydGluZyB0YXNrIGRlZmluaXRpb25zIHJlZ2lzdGVyZWQgYnkgZGVwbG95LWFwcCB3b3JrZmxvd1xuICAgIGNvbnN0IGNmblNlcnZpY2UgPSBzZXJ2aWNlLm5vZGUuZGVmYXVsdENoaWxkIGFzIGVjcy5DZm5TZXJ2aWNlO1xuICAgIGNmblNlcnZpY2UuYWRkUHJvcGVydHlPdmVycmlkZShcbiAgICAgIFwiVGFza0RlZmluaXRpb25cIixcbiAgICAgIGAke3RpZXJ9LSR7YXBwTmFtZX0tJHthcHBTZXJ2aWNlfWBcbiAgICApO1xuICAgIGNmblNlcnZpY2UuYWRkUHJvcGVydHlEZWxldGlvbk92ZXJyaWRlKFwiRGVzaXJlZENvdW50XCIpO1xuXG4gICAgLy8gU2NoZWR1bGVkIGF1dG8tc2NhbGluZyAobm9uLXByb2Q6IHNjYWxlIHRvIDAgbmlnaHRzL3dlZWtlbmRzKVxuICAgIGlmIChwcm9wcy5ub25Qcm9kU2NoZWR1bGUpIHtcbiAgICAgIGNvbnN0IHNjYWxhYmxlID0gc2VydmljZS5hdXRvU2NhbGVUYXNrQ291bnQoe1xuICAgICAgICBtaW5DYXBhY2l0eTogMCxcbiAgICAgICAgbWF4Q2FwYWNpdHk6IHByb3BzLnNjaGVkdWxlZE1heENhcGFjaXR5LFxuICAgICAgfSk7XG5cbiAgICAgIHNjYWxhYmxlLnNjYWxlT25TY2hlZHVsZShcIlNjYWxlT3V0XCIsIHtcbiAgICAgICAgc2NoZWR1bGU6IGFwcHNjYWxpbmcuU2NoZWR1bGUuY3Jvbih7XG4gICAgICAgICAgaG91cjogXCI3XCIsXG4gICAgICAgICAgbWludXRlOiBcIjBcIixcbiAgICAgICAgICB3ZWVrRGF5OiBcIk1PTi1GUklcIixcbiAgICAgICAgfSksXG4gICAgICAgIG1pbkNhcGFjaXR5OiBwcm9wcy5zY2hlZHVsZWRNaW5DYXBhY2l0eSxcbiAgICAgICAgbWF4Q2FwYWNpdHk6IHByb3BzLnNjaGVkdWxlZE1heENhcGFjaXR5LFxuICAgICAgICB0aW1lWm9uZTogY2RrLlRpbWVab25lLkFNRVJJQ0FfTkVXX1lPUkssXG4gICAgICB9KTtcblxuICAgICAgc2NhbGFibGUuc2NhbGVPblNjaGVkdWxlKFwiU2NhbGVJblwiLCB7XG4gICAgICAgIHNjaGVkdWxlOiBhcHBzY2FsaW5nLlNjaGVkdWxlLmNyb24oe1xuICAgICAgICAgIGhvdXI6IFwiMTlcIixcbiAgICAgICAgICBtaW51dGU6IFwiMFwiLFxuICAgICAgICAgIHdlZWtEYXk6IFwiTU9OLUZSSVwiLFxuICAgICAgICB9KSxcbiAgICAgICAgbWluQ2FwYWNpdHk6IDAsXG4gICAgICAgIG1heENhcGFjaXR5OiAwLFxuICAgICAgICB0aW1lWm9uZTogY2RrLlRpbWVab25lLkFNRVJJQ0FfTkVXX1lPUkssXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBTU00gcGFyYW1ldGVycyBmb3IgZGVwbG95LWFwcCB3b3JrZmxvd1xuICAgIG5ldyBzc20uU3RyaW5nUGFyYW1ldGVyKHRoaXMsIFwiU3NtRWNzQ2x1c3RlclwiLCB7XG4gICAgICBwYXJhbWV0ZXJOYW1lOiBgLyR7YXBwTmFtZXNwYWNlfS8ke3RpZXJ9LyR7YXBwTmFtZX0vZWNzX2NsdXN0ZXJgLFxuICAgICAgc3RyaW5nVmFsdWU6IGNsdXN0ZXJOYW1lLFxuICAgIH0pO1xuXG4gICAgbmV3IHNzbS5TdHJpbmdQYXJhbWV0ZXIodGhpcywgXCJTc21FY3NXZWJUYXNrXCIsIHtcbiAgICAgIHBhcmFtZXRlck5hbWU6IGAvJHthcHBOYW1lc3BhY2V9LyR7dGllcn0vJHthcHBOYW1lfS9lY3Nfd2ViX3Rhc2tgLFxuICAgICAgc3RyaW5nVmFsdWU6IGAke3RpZXJ9LSR7YXBwTmFtZX0tJHthcHBTZXJ2aWNlfWAsXG4gICAgfSk7XG5cbiAgICBuZXcgc3NtLlN0cmluZ1BhcmFtZXRlcih0aGlzLCBcIlNzbUVjc1dlYlNlcnZpY2VcIiwge1xuICAgICAgcGFyYW1ldGVyTmFtZTogYC8ke2FwcE5hbWVzcGFjZX0vJHt0aWVyfS8ke2FwcE5hbWV9L2Vjc193ZWJfc2VydmljZWAsXG4gICAgICBzdHJpbmdWYWx1ZTogYCR7dGllcn0tJHthcHBOYW1lfS0ke2FwcFNlcnZpY2V9YCxcbiAgICB9KTtcblxuICAgIG5ldyBzc20uU3RyaW5nUGFyYW1ldGVyKHRoaXMsIFwiU3NtUm9sZUFyblwiLCB7XG4gICAgICBwYXJhbWV0ZXJOYW1lOiBgLyR7YXBwTmFtZXNwYWNlfS8ke3RpZXJ9LyR7YXBwTmFtZX0vcm9sZV9hcm5gLFxuICAgICAgc3RyaW5nVmFsdWU6IGFwcFJvbGVBcm4sXG4gICAgfSk7XG5cbiAgICAvLyBTdGFjayBvdXRwdXRzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgXCJXZWJTZXJ2aWNlTmFtZVwiLCB7XG4gICAgICB2YWx1ZTogc2VydmljZS5zZXJ2aWNlTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkVDUyBTZXJ2aWNlIE5hbWVcIixcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIFwiV2ViVGFza0RlZkFyblwiLCB7XG4gICAgICB2YWx1ZTogdGFza0RlZi50YXNrRGVmaW5pdGlvbkFybixcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlRhc2sgRGVmaW5pdGlvbiBBUk5cIixcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIFwiVGFyZ2V0R3JvdXBBcm5cIiwge1xuICAgICAgdmFsdWU6IHRnLnRhcmdldEdyb3VwQXJuLFxuICAgICAgZGVzY3JpcHRpb246IFwiVGFyZ2V0IEdyb3VwIEFSTlwiLFxuICAgIH0pO1xuICB9XG59XG4iXX0=