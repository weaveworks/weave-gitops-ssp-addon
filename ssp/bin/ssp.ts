import * as cdk from '@aws-cdk/core';
import * as ssp from '@shapirov/cdk-eks-blueprint';
import * as wego from '@weaveworksoss/weavegitops-ssp-addon';
import { TeamGreen, TeamBlue } from './teams';
const app = new cdk.App();

let bootstrapRepository = {
    URL: "ssh://git@github.com/weaveworks/weave-gitops-ssp-addon",
    branch: "main",
    path: "./bootstrap",
    secretName: "<ARN for AWS Secrets Manager Secret holding SSH Credentials",
} as wego.BootstrapRepository;

const GitOps = new wego.WeaveGitOpsAddOn(
    bootstrapRepository,
    "wego-system",
)

const addOns: Array<ssp.ClusterAddOn> = [
    GitOps,
    new ssp.addons.NginxAddOn,
    new ssp.addons.CalicoAddOn,
    new ssp.addons.MetricsServerAddOn,
    new ssp.addons.ClusterAutoScalerAddOn,
    new ssp.addons.ContainerInsightsAddOn,
    new ssp.addons.AwsLoadBalancerControllerAddOn()
];

const account = '<AWS ACCOUNT NUMBER>';
const region = '<AWS REGION>';
const props = { env: { account, region } };
const scope = new cdk.Construct(app, '<ID for your CDK Application>');
const teams = [ new TeamBlue(), new TeamGreen() ];
new ssp.stacks.EksBlueprint(scope, { id: '<ID for this EKS Blueprint>', addOns, teams }, props);