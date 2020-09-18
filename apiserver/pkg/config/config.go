// Copyright © 2016 National Data Service
package config

type Config struct {
	Name            string        `json:"name"`
	Port            string        `json:"port"`
	AdminPort       string        `json:"adminPort"`
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
	HomePvcSuffix   string        `json:"homePvcSuffix"`
	Volumes         []Volume      `json:"volumes"`
	Support         SupportLinks  `json:"support"`
	AuthURL         string        `json:"authURL"`
	AuthSignInURL   string        `json:"authSignInURL"`
}

type SupportLinks struct {
	Email string `json:"email"`
	Forum string `json:"forum"`
	Chat  string `json:"chat"`
}

type Specs struct {
	Path string `json:"path"`
}
type Volume struct {
	Path     string `json:"path"`
	Name     string `json:"name"`
	ReadOnly bool   `json:"readOnly"`
}

type DefaultLimits struct {
	CpuMax          int `json:"cpuMax"`
	CpuDefault      int `json:"cpuDefault"`
	MemMax          int `json:"memMax"`
	MemDefault      int `json:"memDefault"`
	StorageDefault  int `json:"storageDefault"`
	InactiveTimeout int `json:"inactiveTimeout"`
}
type Etcd struct {
	Address     string `json:"address"`
	MaxMessages int    `json:"maxMessages"`
}
type Kubernetes struct {
	Address           string  `json:"address"`
	TokenPath         string  `json:"tokenPath"`
	Username          string  `json:"username"`
	Password          string  `json:"password"`
	NodeSelectorName  string  `json:"nodeSelectorName"`
	NodeSelectorValue string  `json:"nodeSelectorValue"`
	StorageClass      string  `json:"pvcStorageClass"`
	QPS               float32 `json:"qps"`
	Burst             int     `json:"burst"`
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
