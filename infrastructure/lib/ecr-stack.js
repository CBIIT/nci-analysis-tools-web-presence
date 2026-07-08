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
exports.EcrStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ecr = __importStar(require("aws-cdk-lib/aws-ecr"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
class EcrStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const { tier, appName, ecrRepoName, ecrCountNumber } = props;
        cdk.Tags.of(this).add("EnvironmentTier", tier);
        cdk.Tags.of(this).add("ResourceName", `${tier}-${appName}-ecr`);
        cdk.Tags.of(this).add("ManagedBy", "cdk");
        cdk.Tags.of(this).add("CreatedBy", "cdk");
        cdk.Tags.of(this).add("Project", "dceg-analysistools");
        cdk.Tags.of(this).add("ApplicationName", appName);
        if (tier === "dev" || tier === "stage") {
            const repo = new ecr.Repository(this, "EcrRepo", {
                repositoryName: ecrRepoName,
                imageScanOnPush: true,
                imageTagMutability: ecr.TagMutability.MUTABLE,
                removalPolicy: cdk.RemovalPolicy.RETAIN,
            });
            repo.addToResourcePolicy(new iam.PolicyStatement({
                sid: "LambdaAccess",
                effect: iam.Effect.ALLOW,
                principals: [new iam.ServicePrincipal("lambda.amazonaws.com")],
                actions: ["ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer"],
            }));
            if (tier === "dev") {
                repo.addLifecycleRule({
                    description: `Keep last ${ecrCountNumber} images`,
                    maxImageCount: ecrCountNumber,
                    rulePriority: 1,
                    tagStatus: ecr.TagStatus.ANY,
                });
            }
            new cdk.CfnOutput(this, "EcrRepoUri", { value: repo.repositoryUri });
        }
    }
}
exports.EcrStack = EcrStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWNyLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWNyLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx5REFBMkM7QUFDM0MseURBQTJDO0FBVTNDLE1BQWEsUUFBUyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ3JDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBb0I7UUFDNUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxHQUFHLEtBQUssQ0FBQztRQUU3RCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDL0MsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxHQUFHLElBQUksSUFBSSxPQUFPLE1BQU0sQ0FBQyxDQUFDO1FBQ2hFLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDMUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMxQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLG9CQUFvQixDQUFDLENBQUM7UUFDdkQsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRWxELElBQUksSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLEtBQUssT0FBTyxFQUFFLENBQUM7WUFDdkMsTUFBTSxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUU7Z0JBQy9DLGNBQWMsRUFBRSxXQUFXO2dCQUMzQixlQUFlLEVBQUUsSUFBSTtnQkFDckIsa0JBQWtCLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO2dCQUM3QyxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNO2FBQ3hDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxtQkFBbUIsQ0FDdEIsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO2dCQUN0QixHQUFHLEVBQUUsY0FBYztnQkFDbkIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSztnQkFDeEIsVUFBVSxFQUFFLENBQUMsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsc0JBQXNCLENBQUMsQ0FBQztnQkFDOUQsT0FBTyxFQUFFLENBQUMsbUJBQW1CLEVBQUUsNEJBQTRCLENBQUM7YUFDN0QsQ0FBQyxDQUNILENBQUM7WUFFRixJQUFJLElBQUksS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDbkIsSUFBSSxDQUFDLGdCQUFnQixDQUFDO29CQUNwQixXQUFXLEVBQUUsYUFBYSxjQUFjLFNBQVM7b0JBQ2pELGFBQWEsRUFBRSxjQUFjO29CQUM3QixZQUFZLEVBQUUsQ0FBQztvQkFDZixTQUFTLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHO2lCQUM3QixDQUFDLENBQUM7WUFDTCxDQUFDO1lBRUQsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUM7UUFDdkUsQ0FBQztJQUNILENBQUM7Q0FDRjtBQTFDRCw0QkEwQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XG5pbXBvcnQgKiBhcyBlY3IgZnJvbSBcImF3cy1jZGstbGliL2F3cy1lY3JcIjtcbmltcG9ydCAqIGFzIGlhbSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWlhbVwiO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBFY3JTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICB0aWVyOiBzdHJpbmc7XG4gIGFwcE5hbWU6IHN0cmluZztcbiAgZWNyUmVwb05hbWU6IHN0cmluZztcbiAgZWNyQ291bnROdW1iZXI6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIEVjclN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEVjclN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IHsgdGllciwgYXBwTmFtZSwgZWNyUmVwb05hbWUsIGVjckNvdW50TnVtYmVyIH0gPSBwcm9wcztcblxuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZChcIkVudmlyb25tZW50VGllclwiLCB0aWVyKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoXCJSZXNvdXJjZU5hbWVcIiwgYCR7dGllcn0tJHthcHBOYW1lfS1lY3JgKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoXCJNYW5hZ2VkQnlcIiwgXCJjZGtcIik7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKFwiQ3JlYXRlZEJ5XCIsIFwiY2RrXCIpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZChcIlByb2plY3RcIiwgXCJkY2VnLWFuYWx5c2lzdG9vbHNcIik7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKFwiQXBwbGljYXRpb25OYW1lXCIsIGFwcE5hbWUpO1xuXG4gICAgaWYgKHRpZXIgPT09IFwiZGV2XCIgfHwgdGllciA9PT0gXCJzdGFnZVwiKSB7XG4gICAgICBjb25zdCByZXBvID0gbmV3IGVjci5SZXBvc2l0b3J5KHRoaXMsIFwiRWNyUmVwb1wiLCB7XG4gICAgICAgIHJlcG9zaXRvcnlOYW1lOiBlY3JSZXBvTmFtZSxcbiAgICAgICAgaW1hZ2VTY2FuT25QdXNoOiB0cnVlLFxuICAgICAgICBpbWFnZVRhZ011dGFiaWxpdHk6IGVjci5UYWdNdXRhYmlsaXR5Lk1VVEFCTEUsXG4gICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICAgIH0pO1xuXG4gICAgICByZXBvLmFkZFRvUmVzb3VyY2VQb2xpY3koXG4gICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICBzaWQ6IFwiTGFtYmRhQWNjZXNzXCIsXG4gICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgIHByaW5jaXBhbHM6IFtuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoXCJsYW1iZGEuYW1hem9uYXdzLmNvbVwiKV0sXG4gICAgICAgICAgYWN0aW9uczogW1wiZWNyOkJhdGNoR2V0SW1hZ2VcIiwgXCJlY3I6R2V0RG93bmxvYWRVcmxGb3JMYXllclwiXSxcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAgIGlmICh0aWVyID09PSBcImRldlwiKSB7XG4gICAgICAgIHJlcG8uYWRkTGlmZWN5Y2xlUnVsZSh7XG4gICAgICAgICAgZGVzY3JpcHRpb246IGBLZWVwIGxhc3QgJHtlY3JDb3VudE51bWJlcn0gaW1hZ2VzYCxcbiAgICAgICAgICBtYXhJbWFnZUNvdW50OiBlY3JDb3VudE51bWJlcixcbiAgICAgICAgICBydWxlUHJpb3JpdHk6IDEsXG4gICAgICAgICAgdGFnU3RhdHVzOiBlY3IuVGFnU3RhdHVzLkFOWSxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIFwiRWNyUmVwb1VyaVwiLCB7IHZhbHVlOiByZXBvLnJlcG9zaXRvcnlVcmkgfSk7XG4gICAgfVxuICB9XG59XG4iXX0=