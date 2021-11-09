import * as cdk from '@aws-cdk/core';
import * as eks from "@aws-cdk/aws-eks";

import {ClusterInfo, Team} from '@aws-quickstart/ssp-amazon-eks';

export class TeamGreen implements Team {
    readonly name: string = 'team-green';

    setup(clusterInfo: ClusterInfo) {
        const cluster = clusterInfo.cluster;
        const stack = cluster.stack;
        const namespace = cluster.addManifest(this.name, {
            apiVersion: 'v1',
            kind: 'Namespace',
            metadata: {
                name: `${this.name}-ns`
            }
        });

        this.setupNamespacePolicies(cluster);
        const sa = cluster.addServiceAccount(`${this.name}-sa`, {
            name: `${this.name}-sa`,
            namespace: `${this.name}-ns`
        });
        sa.node.addDependency(namespace);
        new cdk.CfnOutput(stack, this.name + '-sa-iam-role', {value: sa.role.roleArn})
    }

    setupNamespacePolicies(cluster: eks.Cluster) {
        const teamQuota = `${this.name}-quota`;
        cluster.addManifest(teamQuota, {
            apiVersion: 'v1',
            kind: 'ResourceQuota',
            metadata: {name: teamQuota},
            spec: {
                hard: {
                    'requests.cpu': '10',
                    'requests.memory': '10Gi',
                    'limits.cpu': '20',
                    'limits.memory': '20Gi'
                }
            }
        })
    }
}