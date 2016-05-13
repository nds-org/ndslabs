// Copyright © 2016 National Data Service
package types

type ServiceSpec struct {
	Key            string              `json:"key"`
	Label          string              `json:"label"`
	Description    string              `json:"description"`
	Maintainer     string              `json:"maintainer"`
	RequiresVolume bool                `json:"requiresVolume"`
	Config         []Config            `json:"config"`
	Image          string              `json:"image"`
	Ports          []Port              `json:"ports"`
	CreatedTime    int                 `json:"createdTime"`
	UpdatedTime    int                 `json:"updateTime"`
	ReadyProbe     ReadyProbe          `json:"readinessProbe"`
	VolumeMounts   []VolumeMount       `json:"volumeMounts"`
	Args           []string            `json:"args"`
	Command        []string            `json:"command"`
	Dependencies   []ServiceDependency `json:"depends"`
	Access         string              `json:"access"`
	Display        string              `json:"display"`
	ResourceLimits ResourceLimits      `json:"resourceLimits"`
}

type Config struct {
	Name        string `json:"name"`
	Value       string `json:"value"`
	Label       string `json:"label"`
	IsPassword  bool   `json:"isPassword"`
	CanOverride bool   `json:"canOverride"`
}

type Port struct {
	Port     int32  `json:"port"`
	Protocol string `json:"protocol"`
}

type VolumeMount struct {
	MountPath string `json:"mountPath"`
	Name      string `json:"name"`
}
type ReadyProbe struct {
	Type         string `json:"type"`
	Path         string `json:"path"`
	Port         int    `json:"port"`
	InitialDelay int32  `json:"initialDelay"`
	Timeout      int32  `json:"timeout"`
}

type ProjectList struct {
	Items []Project `json:"items"`
}

type Project struct {
	Id             string         `json:"id"`
	Name           string         `json:"name"`
	Description    string         `json:"description"`
	Namespace      string         `json:"namespace"`
	EmailAddress   string         `json:"email"`
	Password       string         `json:"password"`
	ResourceLimits ResourceLimits `json:"resourceLimits"`
}

type ResourceLimits struct {
	CPUMax        string `json:"cpuMax"`
	CPUDefault    string `json:"cpuDefault"`
	MemoryMax     string `json:"memMax"`
	MemoryDefault string `json:"memDefault"`
	StorageQuota  string `json:"storageQuota"`
}

type ServiceList struct {
	Items []Service `json:"items"`
}

type Service struct {
	Id             string              `json:"id"`
	Key            string              `json:"key"`
	Label          string              `json:"label"`
	Description    string              `json:"description"`
	Maintainer     string              `json:"maintainer"`
	RequiresVolume bool                `json:"requiresVolume"`
	IsStack        bool                `json:"isStack"`
	IsService      bool                `json:"isService"`
	Tags           []string            `json:"tags"`
	Ports          []int               `json:"ports"`
	Dependencies   []ServiceDependency `json:"depends"`
	CreatedTime    int                 `json:"createdTime"`
	UpdatedTime    int                 `json:"updateTime"`
}

type ServiceDependency struct {
	DependencyKey string `json:"key"`
	Required      bool   `json:"required"`
	ShareConfig   bool   `json:"shareConfig"`
}

type Stack struct {
	Id          string         `json:"id"`
	Key         string         `json:"key"`
	Name        string         `json:"name"`
	Services    []StackService `json:"services"`
	Status      string         `json:"status"`
	CreatedTime int            `json:"createdTime"`
	UpdatedTime int            `json:"updateTime"`
}

type StackService struct {
	Id            string            `json:"id"`
	Stack         string            `json:"stack"`
	Service       string            `json:"service"`
	Status        string            `json:"status"`
	StatusMessage string            `json:"statusMessage"`
	Endpoints     []Endpoint        `json:"endpoints,omitempty"`
	CreatedTime   int               `json:"createdTime"`
	UpdatedTime   int               `json:"updateTime"`
	Config        map[string]string `json:"config"`
}

type Endpoint struct {
	InternalIP string `json:"internalIP"`
	Port       int32  `json:"port"`
	NodePort   int32  `json:"nodePort"`
	Protocol   string `json:"protocol"`
}

type Volume struct {
	Id          string `json:"id"`
	Name        string `json:"name"`
	Size        int    `json:"size"`
	SizeUnit    string `json:"sizeUnit"`
	Format      string `json:"format"`
	Attached    string `json:"attached"`
	Service     string `json:"service"`
	Status      string `json:"status"`
	Formatted   bool   `json:"formatted"`
	CreatedTime int    `json:"createdTime"`
	UpdatedTime int    `json:"updateTime"`
}
