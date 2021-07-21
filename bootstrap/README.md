# Sample `BootstrapRepository` for EKS SSP Reference Architecture

This repository demonstrates how to create workloads for multiple teams using the Shared Services Platform Reference Architecture.

In our sample SSP implementation found inside the [`ssp` directory](../ssp/README.md) you will find two sample `Teams`, `TeamBlue` and `TeamGreen`.

In this bootstrap repository we will define the workloads for each team, creating a `GitRepository` and `Kustomization` for each team, using the `ServiceAccount` created for each of them by the SSP.