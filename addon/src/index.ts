import { ClusterAddOn, ClusterInfo, ClusterPostDeploy, Team } from '@shapirov/cdk-eks-blueprint';
import { SecretsManager } from "aws-sdk";

export interface BootstrapRepository {
    /**
     * The SSH URI for the GitHub Repository used for bootstrapping team workloads
     */
    readonly URL: string;
    /**
     * The branch to track for continuous reconciliation
     */
    readonly branch: string;
    /**
     * The path in the repo to use as root for all bootstrap declarations
     */
    readonly path: string;
    /**
     * The name of the AWS Secrets Manager Secret to use for authentication, the secret should contain three keys:
     *      private_key
     *      public_key
     *      known_hosts
     */
    readonly secretName?: string;
    /**
     * The fetched Private Key from the secret
     */
    privateKey?: string;
    /**
     * The fetched Public Key from the secret
     */
    publicKey?: string;
    /**
     * The fetched Known Hosts from the secret
     */
    knownHosts?: string;
}

export class WeaveGitOpsAddOn implements ClusterAddOn, ClusterPostDeploy {

    readonly namespace: string;
    readonly bootstrapRepository: BootstrapRepository;
    debugMode: boolean;

    constructor(bootstrapRepository: BootstrapRepository, namespace?: string, debugMode?: false) {
        this.namespace = namespace ?? "wego-system";
        this.bootstrapRepository = bootstrapRepository;
        this.debugMode = debugMode ?? false;
    }

    getSshKeyFromSecret = async (secretName: string, region: string): Promise<void> => {
        const client = new SecretsManager({ region: region });
        let secretObject: any = {};
        try {
            let response = await client.getSecretValue({ SecretId: secretName }).promise();
            if (response) {
                if (response.SecretString) {
                    secretObject = JSON.parse(response.SecretString);
                } else if (response.SecretBinary) {
                    secretObject = JSON.parse(response.SecretBinary.toString());
                }
            }
            this.bootstrapRepository.privateKey = secretObject.private_key;
            this.bootstrapRepository.publicKey = secretObject.public_key;
            this.bootstrapRepository.knownHosts = secretObject.known_hosts;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    base64EncodeContents(contents: string) {
        return Buffer.from(contents, 'binary').toString('base64');
    }

    deploy(clusterInfo: ClusterInfo): void {
        try {
            clusterInfo.cluster.addHelmChart("weave-gitops-core", {
                chart: "wego-core",
                repository: "https://murillodigital.github.io/wego-helm",
                version: '0.0.1',
                namespace: this.namespace,
            });
        } catch (err) {
            console.error(`Unable to complete Weave GitOps AddOn Core deployment - aborting with error ${err}`);
        }
    }

    async postDeploy(clusterInfo: ClusterInfo, teams: Team[]): Promise<void> {
        try {
            if (this.bootstrapRepository.secretName) {
                await this.getSshKeyFromSecret(this.bootstrapRepository.secretName, clusterInfo.cluster.stack.region);
            }
            if (!this.bootstrapRepository.privateKey || !this.bootstrapRepository.knownHosts) {
                throw "Required details for bootstrap repository access are missing, aborting";
            }
            clusterInfo.cluster.addHelmChart("weave-gitops-application", {
                chart: "wego-app",
                repository: "https://murillodigital.github.io/wego-helm",
                version: '0.0.1',
                namespace: this.namespace,
                values: {
                    applications: [
                        {
                            applicationName: clusterInfo.cluster.clusterName,
                            gitRepository: this.bootstrapRepository.URL,
                            privateKey: this.base64EncodeContents(this.bootstrapRepository.privateKey ?? ""),
                            knownHosts: this.base64EncodeContents(this.bootstrapRepository.knownHosts ?? ""),
                            path: this.bootstrapRepository.path,
                            branch: this.bootstrapRepository.branch,
                        }
                    ]
                }
            });
        } catch (err) {
            console.error(`Unable to complete Weave GitOps AddOn Bootstrapping - aborting with error ${err}`);
        }
    }
}