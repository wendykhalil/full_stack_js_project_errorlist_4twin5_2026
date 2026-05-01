# BMP.tn — Kubernetes Cluster Setup with kubeadm

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                    │
│                                                         │
│  ┌──────────────────┐    ┌──────────────────────────┐  │
│  │   Master Node    │    │      Worker Node(s)       │  │
│  │  (Control Plane) │    │                          │  │
│  │                  │    │  ┌──────────┐            │  │
│  │  - API Server    │    │  │ bmp-back │ x2 pods    │  │
│  │  - etcd          │    │  └──────────┘            │  │
│  │  - Scheduler     │    │  ┌──────────┐            │  │
│  │  - Controller    │    │  │ bmp-front│ x2 pods    │  │
│  └──────────────────┘    │  └──────────┘            │  │
│                          └──────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

All nodes (master + workers) must have:
- Ubuntu 22.04 LTS (or any VM with same OS)
- 2 CPUs minimum, 2GB RAM minimum
- Unique hostname, MAC address, product_uuid
- Swap disabled
- Ports open: 6443, 2379-2380, 10250-10252

## Step 1 — Prepare ALL nodes

Run on **every** node (master + workers):

```bash
# Disable swap
sudo swapoff -a
sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

# Load kernel modules
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF
sudo modprobe overlay
sudo modprobe br_netfilter

# Sysctl settings
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF
sudo sysctl --system

# Install containerd
sudo apt-get update
sudo apt-get install -y containerd
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
sudo systemctl restart containerd
sudo systemctl enable containerd

# Install kubeadm, kubelet, kubectl
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gpg
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.28/deb/Release.key | \
  sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.28/deb/ /' | \
  sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update
sudo apt-get install -y kubelet=1.28.0-1.1 kubeadm=1.28.0-1.1 kubectl=1.28.0-1.1
sudo apt-mark hold kubelet kubeadm kubectl
```

## Step 2 — Initialize Master Node

Run on **master node only**:

```bash
# Initialize cluster (replace <MASTER_IP> with your master node IP)
sudo kubeadm init \
  --pod-network-cidr=10.244.0.0/16 \
  --apiserver-advertise-address=<MASTER_IP> \
  --kubernetes-version=v1.28.0

# Configure kubectl for current user
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Install Flannel CNI (pod networking)
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml

# Verify master is Ready
kubectl get nodes
```

## Step 3 — Join Worker Nodes

The `kubeadm init` output gives you a join command. Run it on each worker:

```bash
# Example (use the actual token from kubeadm init output):
sudo kubeadm join <MASTER_IP>:6443 \
  --token <TOKEN> \
  --discovery-token-ca-cert-hash sha256:<HASH>
```

If the token expired, generate a new one on master:
```bash
kubeadm token create --print-join-command
```

## Step 4 — Install NGINX Ingress Controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/baremetal/deploy.yaml

# Wait for it to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

## Step 5 — Deploy BMP Application

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets (edit values first!)
kubectl apply -f k8s/secrets.yaml

# Create configmap
kubectl apply -f k8s/configmap.yaml

# Deploy backend
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

# Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

# Apply ingress
kubectl apply -f k8s/ingress.yaml

# Apply HPA (requires metrics-server)
kubectl apply -f k8s/hpa.yaml
```

## Step 6 — Install Metrics Server (for HPA)

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Patch for self-signed certs (local clusters)
kubectl patch deployment metrics-server -n kube-system \
  --type='json' \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
```

## Step 7 — Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n bmp-production

# Check services
kubectl get svc -n bmp-production

# Check ingress
kubectl get ingress -n bmp-production

# Check HPA
kubectl get hpa -n bmp-production

# Test health endpoint
kubectl port-forward svc/bmp-backend 5000:5000 -n bmp-production &
curl http://localhost:5000/api/health
```

## Step 8 — Deploy Monitoring Stack

```bash
# Create monitoring namespace
kubectl apply -f k8s/monitoring/namespace.yaml

# Deploy Prometheus
kubectl apply -f k8s/monitoring/prometheus.yaml

# Deploy Grafana
kubectl apply -f k8s/monitoring/grafana.yaml

# Deploy AlertManager
kubectl apply -f k8s/monitoring/alertmanager.yaml

# Deploy Node Exporter
kubectl apply -f k8s/monitoring/node-exporter.yaml
```

## Useful Commands

```bash
# View all resources in namespace
kubectl get all -n bmp-production

# View pod logs
kubectl logs -f deployment/bmp-backend -n bmp-production

# Scale deployment manually
kubectl scale deployment bmp-backend --replicas=3 -n bmp-production

# Rolling update (after pushing new image)
kubectl rollout restart deployment/bmp-backend -n bmp-production
kubectl rollout status deployment/bmp-backend -n bmp-production

# Describe pod (for debugging)
kubectl describe pod <pod-name> -n bmp-production

# Execute into pod
kubectl exec -it <pod-name> -n bmp-production -- /bin/sh
```

## Reset Cluster (if needed)

```bash
# On all nodes
sudo kubeadm reset
sudo rm -rf /etc/cni/net.d
sudo iptables -F && sudo iptables -t nat -F && sudo iptables -t mangle -F && sudo iptables -X
```
