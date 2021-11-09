import * as cdk from '@aws-cdk/core';
import * as eks from '@aws-cdk/aws-eks';
import * as ssp from '@aws-quickstart/ssp-amazon-eks';
import * as wego from '@weaveworksoss/weavegitops-ssp-addon';
import { TeamGreen, TeamBlue } from './teams';
import { SspConfiguration } from './configuration'
import { assertEC2NodeGroup } from '@aws-quickstart/ssp-amazon-eks';
import { InstanceType } from "@aws-cdk/aws-ec2";
const app = new cdk.App();

let sspConfiguration: SspConfiguration = require('./configuration.json');

let bootstraRepositoryGlobal = {
    URL: sspConfiguration.bootstrapRepository.url,
    branch: sspConfiguration.bootstrapRepository.branch,
    secretName: sspConfiguration.bootstrapRepository.secret,
}

sspConfiguration.environments.forEach(environment => {
    let bootstrapRepository = {
        ...bootstraRepositoryGlobal,
        path: environment.path
    } as wego.BootstrapRepository;
    
    const GitOps = new wego.WeaveGitOpsAddOn(
        bootstrapRepository,
        "wego-system",
    )

    const clusterProviderProps: ssp.MngClusterProviderProps = {
        version: eks.KubernetesVersion.V1_21,
        nodeGroupCapacityType: environment.useSpot ? eks.CapacityType.SPOT : eks.CapacityType.ON_DEMAND,
        instanceTypes: environment.clusterConfiguration.instanceTypes.map(instanceType => {
            return new InstanceType(instanceType);
        }),
        minSize: environment.clusterConfiguration.minSize,
        maxSize: environment.clusterConfiguration.maxSize,
        desiredSize: environment.clusterConfiguration.desiredSize
    }

    const addOns: Array<ssp.ClusterAddOn> = [
        GitOps,
        new ssp.addons.CalicoAddOn,
        new ssp.addons.MetricsServerAddOn,
        new ssp.addons.ClusterAutoScalerAddOn,
        new ssp.addons.ContainerInsightsAddOn,
        new ssp.addons.AwsLoadBalancerControllerAddOn(),
        new ssp.addons.NginxAddOn,
        new ssp.addons.VpcCniAddOn(),
        new ssp.addons.CoreDnsAddOn(),
        new ssp.addons.KubeProxyAddOn(),
        new ssp.addons.XrayAddOn()
    ];
    
    const account = environment.account;
    const region = environment.region;
    const props = { env: { account, region } };
    const clusterProvider = new ssp.MngClusterProvider(clusterProviderProps);
    new ssp.EksBlueprint(app, { id: `ssp-${environment.name}`, addOns, teams: [], clusterProvider }, props);
})
