# Weave GitOps AddOn for EKS SSP Reference Architecture

Weave GitOps addon and AWS Shared Services Platform share the same goal: to make app delivery in Kubernetes simple. In other words, allowing developers to abstract themselves from infrastructure management and deploy their workloads fast.

This Weave GitOps addon is designed to run with ‘cdk-eks-blueprint’ to enable GitOps instantly in the provisioned environment. What does it mean to enable GitOps?

* To have a continuously reconciled source repo and target environment by installing this add-on. This automation will prevent drift and guarantee secured deployment of workloads as well as a consistent state from the start.
* Lifecycle management deploy and post deploy. Weave GitOps takes care orderly of the sequential dependencies your environment requires. Think of the bootstrapping repo with the team’s workloads, the secrets hosted in AWS Secrets Manager and so on.

## What does Weave GitOps addon look like?

The addon itself is a typescript [package hosted in npm](https://www.npmjs.com/settings/weaveworksoss/packages).

You can install it using `npm` and use it in your implementation of the EKS SSP Blueprint. The Weave GitOps Addon requires a `BootstrapRepository` which will hold the desired state of your cluster, including all workloads for any `Teams` created as part of your Shared Services Platform. See [bootstrap.md](bootstrap.md) for specifics on repository structure.

## Prerequisites to use the Weave GitOps addon for EKS Shared Service Platform:

- A bootstrapping repo must exist. This will hold declarations and references to all workloads that the teams enjoying SSP will operate.
- A defined secret in AWS Secret Manager ([get started here](https://aws.amazon.com/secrets-manager/)). The secret must contain the following three keys:
  
    - `private_key`: private key for SSH access to the repo.
    - `public_key`: corresponding public key pair.
    - `known_hosts`: SSH identity for Git repository defined above (to generate the value of this key you can use the command `ssh-keyscan <git server>`).
    
> Note: Although Weave GitOps supports HTTPS access to repositories as well as non-ssh methods of authentication, currently only SSH access to repositories is supported. Other mechanisms will be enabled in future versions.

The best way for Weave GitOps addon to handle the connection between the bootstrapping repo and the target environment is to pass the secret `ARN` when instantiating the AddOn on your SSP implementation ([see implementation details](ssp.md)).

Having said that, you can always ignore that setting and pass ‘private_key’, ‘public_key’, and ‘known_hosts’ in the configuration. We strongly suggest that you choose the former unless you are testing the addon. If you specify both, the secret ARN will override the plain text keys and known hosts definition.

The addon Lifecycle has two stages which are managed by the addon itself:

1. **Deploy**: During this stage the addon installs Weave GitOps core components of which you can learn more [here](https://docs.gitops.weave.works/docs/intro#features).
2. **Post deploy**: Once the Core components are in place then a Weave GitOps `application` will be defined pointing to your specific `bootstrap` repository. Weave GitOps `applications` make your workloads deployable and can include any number of other `applications` pointing to different repositories and allow for `helm` or `kustomize` workload declaration. 

To learn more about apps and targets in the context of Weave GitOps read [GitOps Automation Configuration](https://docs.gitops.weave.works/docs/gitops-automation).
