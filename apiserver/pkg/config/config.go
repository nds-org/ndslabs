// Copyright © 2016 National Data Service
package config

type Config struct {
	Port            string        `json:"port"`
	Origin          string        `json:"origin"`
	Timeout         int           `json:"timeout"`
	Prefix          string        `json:"prefix"`
	Domain          string        `json:"domain"`
	RequireApproval bool          `json:"requireApproval"`
	Ingress         IngressType   `json:"ingress"`
	DefaultLimits   DefaultLimits `json:"defaultLimits"`
	Etcd            Etcd          `json:"etcd"`
	Kubernetes      Kubernetes    `json:"kubernetes"`
	Email           Email         `json:"email"`
	Specs           Specs         `json:"specs"`
	SupportEmail    string        `json:"supportEmail"`
	HomeVolume      string        `json:"homeVolume"`
	Volumes         []Volume      `json:"volumes"`
	DataProviderURL string        `json:"dataProviderURL"`
}

type Specs struct {
	Path string `json:"path"`
}
type Volume struct {
	Path string     `json:"path"`
	Name string     `json:"name"`
	Type VolumeType `json:"type"`
}

type DefaultLimits struct {
	CpuMax         int `json:"cpuMax"`
	CpuDefault     int `json:"cpuDefault"`
	MemMax         int `json:"memMax"`
	MemDefault     int `json:"memDefault"`
	StorageDefault int `json:"storageDefault"`
}
type Etcd struct {
	Address     string `json:"address"`
	MaxMessages int    `json:"maxMessages"`
}
type Kubernetes struct {
	Address   string `json:"address"`
	TokenPath string `json:"tokenPath"`
	Username  string `json:"username"`
	Password  string `json:"password"`
}
type Email struct {
	Host string `json:"host"`
	Port int    `json:"port"`
	TLS  bool   `json:"tls"`
}

type IngressType string

const (
	IngressTypeLoadBalancer IngressType = "LoadBalancer"
	IngressTypeNodePort     IngressType = "NodePort"
)

type VolumeType string

const (
	VolumeTypeGluster VolumeType = "gluster"
	VolumeTypeNFS     VolumeType = "nfs"
	VolumeTypeLocal   VolumeType = "local"
)
