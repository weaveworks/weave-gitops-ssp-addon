import { InstanceType } from "@aws-cdk/aws-ec2";

interface ClusterConfiguration {
    minSize: number,
    maxSize: number,
    desiredSize: number,
    instanceTypes: string[],
}

interface EnvironmentConfiguration {
    name: string,
    path: string,
    useSpot: boolean,
    region: string,
    account: string,
    clusterConfiguration: ClusterConfiguration,
}

interface BootstrapRepositoryConfiguration {
    url: string,
    branch: string,
    secret: string,
}

export interface SspConfiguration {
    environments: EnvironmentConfiguration[],
    bootstrapRepository: BootstrapRepositoryConfiguration,
}