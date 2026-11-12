import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { EcrStack } from "../lib/ecr-stack";
import { EcsAppStack } from "../lib/ecs-app-stack";

const account = "111111111111";
const region = "us-east-1";
const vpcId = "vpc-12345678";
const subnetIds = ["subnet-12345678", "subnet-23456789"];

function appWithVpc(): cdk.App {
  const vpcContextKey = `vpc-provider:account=${account}:filter.vpc-id=${vpcId}:region=${region}:returnAsymmetricSubnets=true`;
  return new cdk.App({
    context: {
      "@aws-cdk/core:explicitStackTags": true,
      [vpcContextKey]: {
        vpcId,
        vpcCidrBlock: "10.0.0.0/16",
        availabilityZones: ["us-east-1a", "us-east-1b"],
        subnetGroups: [
          {
            name: "Private",
            type: "Private",
            subnets: subnetIds.map((subnetId, index) => ({
              subnetId,
              availabilityZone: `us-east-1${index === 0 ? "a" : "b"}`,
              routeTableId: `rtb-${index === 0 ? "12345678" : "23456789"}`,
            })),
          },
        ],
      },
    },
  });
}

describe("infrastructure stack synthesis", () => {
  test.each([
    { tier: "dev", hasLifecyclePolicy: true },
    { tier: "stage", hasLifecyclePolicy: false },
  ])("preserves the $tier ECR repository", ({ tier, hasLifecyclePolicy }) => {
    const stack = new EcrStack(new cdk.App(), "Ecr", {
      env: { account, region },
      tier,
      appName: "analysistools-portal",
      ecrRepoName: "analysistools-portal",
      ecrCountNumber: 10,
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::ECR::Repository", 1);
    template.hasResourceProperties("AWS::ECR::Repository", {
      RepositoryName: "analysistools-portal",
      ImageScanningConfiguration: { ScanOnPush: true },
      ImageTagMutability: "MUTABLE",
    });

    const [repository] = Object.values(
      template.findResources("AWS::ECR::Repository")
    );
    if (hasLifecyclePolicy) {
      expect(repository).toHaveProperty("Properties.LifecyclePolicy");
    } else {
      expect(repository).not.toHaveProperty("Properties.LifecyclePolicy");
    }
  });

  test.each([
    { tier: "dev", nonProdSchedule: true, scalableTargets: 1 },
    { tier: "prod", nonProdSchedule: false, scalableTargets: 0 },
  ])(
    "preserves the $tier application stack's resource tags",
    ({ tier, nonProdSchedule, scalableTargets }) => {
      const stack = new EcsAppStack(appWithVpc(), "Application", {
        env: { account, region },
        tier,
        appName: "analysistools-portal",
        appNamespace: "analysistools",
        appService: "web",
        appDomain: `${tier}.example.com`,
        vpcId,
        subnetIds,
        securityGroupIds: ["sg-12345678"],
        clusterArn: `arn:aws:ecs:${region}:${account}:cluster/test-cluster`,
        listenerArn: `arn:aws:elasticloadbalancing:${region}:${account}:listener/app/test/1234567890123456/abcdef0123456789`,
        appRoleArn: `arn:aws:iam::${account}:role/test-role`,
        listenerRulePriority: 999,
        healthCheckPath: "/",
        gracePeriod: 60,
        cpu: 256,
        memory: 512,
        desiredCount: 1,
        containerPort: 80,
        nonProdSchedule,
        scheduledMinCapacity: 1,
        scheduledMaxCapacity: 1,
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties("AWS::ElasticLoadBalancingV2::TargetGroup", {
        VpcId: vpcId,
        Tags: Match.arrayWith([{ Key: "EnvironmentTier", Value: tier }]),
      });
      template.resourceCountIs("AWS::ElasticLoadBalancingV2::ListenerRule", 1);
      template.resourceCountIs(
        "AWS::ApplicationAutoScaling::ScalableTarget",
        scalableTargets
      );
      for (const resource of Object.values({
        ...template.findResources("AWS::ElasticLoadBalancingV2::ListenerRule"),
        ...template.findResources("AWS::ApplicationAutoScaling::ScalableTarget"),
      })) {
        expect(resource).not.toHaveProperty("Properties.Tags");
      }
    }
  );
});
