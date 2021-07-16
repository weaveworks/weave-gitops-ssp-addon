# Using the Weave GitOps Addon in your EKS SSP

Before you can use the Weave GitOps Addon in your SSP implementation, please follow the instructions in the [AWS Quickstart Repo](https://github.com/aws-quickstart/quickstart-ssp-amazon-eks) to initialize your CDK project and include the `cdk-eks-blueprint` dependency.

Add the `@weaveworksoss/weavegitops-ssp-addon` package to your project and save it in your `package.json` file by running the following command:

```shell
npm install @weaveworksoss/weavegitops-ssp-addon
```

Import the addon in your `bin/<your-main-file>.ts` file, create a `BootstrapRepository` object and use that to create a new `WeaveGitOpsAddOn` object, which you'll add to the array of AddOns to include in your cluster:

```typescript
import * as wego from '@weaveworksoss/weavegitops-ssp-addon';

let bootstrapRepository = {
    URL: "<SSH URL for your Bootstrap Git Repository>",
    branch: "<branch to track on the repository>",
    path: "<path in the repo that holds your bootstrap manifests>",
    secretName: "<AWS Secret Manager secret ARN with SSH access details>",
} as wego.BootstrapRepository;

const GitOps = new wego.WeaveGitOpsAddOn(
    bootstrapRepository,
    "wego-system", // Name of the namespace to deploy Weave GitOps on, wego-system is default
)

const addOns: Array<ssp.ClusterAddOn> = [
    GitOps, // Add the instance of the AddOn to the array of cluster AddOns you wish to install
    new ssp.addons.NginxAddOn,
    new ssp.addons.CalicoAddOn,
    new ssp.addons.MetricsServerAddOn,
    new ssp.addons.ClusterAutoScalerAddOn,
    new ssp.addons.ContainerInsightsAddOn,
    new ssp.addons.AwsLoadBalancerControllerAddOn()
];
```
This is all you need to do to have Weave GitOps automatically installed as part of your SSP platform, and automatically bootstrapped, following the GitOps methodology, with all declared workloads as declared in the specified `BootstrapRepository`.

To know more about how to structure the `BootstrapRepository` please see [bootstrap.md](bootstrap.md).