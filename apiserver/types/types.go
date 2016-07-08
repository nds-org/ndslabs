// Copyright © 2016 National Data Service
package types

type ServiceSpec struct {
	Id                   string              `json:"id"`
	Key                  string              `json:"key"`
	Label                string              `json:"label"`
	Description          string              `json:"description"`
	Logo                 string              `json:"logo"`
	Maintainer           string              `json:"maintainer"`
	RequiresVolume       bool                `json:"requiresVolume"`
	Image                ServiceImage        `json:"image"`
	Display              string              `json:"display"`
	Access               AccessType          `json:"access"`
	Dependencies         []ServiceDependency `json:"depends"`
	Config               []Config            `json:"config"`
	Command              []string            `json:"command"`
	Args                 []string            `json:"args"`
	Ports                []Port              `json:"ports"`
	Repositories         []Repository        `json:"repository"`
	CreatedTime          int                 `json:"createdTime"`
	UpdatedTime          int                 `json:"updateTime"`
	ReadyProbe           ReadyProbe          `json:"readinessProbe"`
	VolumeMounts         []VolumeMount       `json:"volumeMounts"`
	ResourceLimits       ResourceLimits      `json:"resourceLimits"`
	Catalog              string              `json:"catalog"`
	DeveloperEnvironment string              `json:"developerEnvironment"`
	Tags                 []string            `json:"tags"`
}

type ServiceImage struct {
	Registry string   `json:"registry"`
	Name     string   `json:"name"`
	Tags     []string `json:"tags"`
}

type Repository struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type ServiceSorter []ServiceSpec

func (s ServiceSorter) Len() int           { return len(s) }
func (s ServiceSorter) Swap(i, j int)      { s[i], s[j] = s[j], s[i] }
func (s ServiceSorter) Less(i, j int) bool { return s[i].Key < s[j].Key }

type AccessType string

const (
	AccessExternal AccessType = "external"
	AccessInternal AccessType = "internal"
)

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

type AccountList struct {
	Items []Account `json:"items"`
}

type Account struct {
	Id             string         `json:"id"`
	Name           string         `json:"name"`
	Description    string         `json:"description"`
	Namespace      string         `json:"namespace"`
	StorageQuota   int            `json:"storageQuota"`
	EmailAddress   string         `json:"email"`
	Password       string         `json:"password"`
	ResourceLimits ResourceLimits `json:"resourceLimits"`
	ResourceUsage  ResourceUsage  `json:"resourceUsage"`
}

type ResourceLimits struct {
	CPUMax        string `json:"cpuMax"`
	CPUDefault    string `json:"cpuDefault"`
	MemoryMax     string `json:"memMax"`
	MemoryDefault string `json:"memDefault"`
	StorageQuota  string `json:"storageQuota"`
}

type ResourceUsage struct {
	CPU       string `json:"cpu"`
	Memory    string `json:"memory"`
	Storage   string `json:"storage"`
	CPUPct    string `json:"cpuPct"`
	MemoryPct string `json:"memPct"`
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
	Id             string            `json:"id"`
	Stack          string            `json:"stack"`
	Service        string            `json:"service"`
	ImageTag       string            `json:"imageTag"`
	Status         string            `json:"status"`
	StatusMessages []string          `json:"statusMessages"`
	Endpoints      []Endpoint        `json:"endpoints,omitempty"`
	CreatedTime    int               `json:"createdTime"`
	UpdatedTime    int               `json:"updateTime"`
	Config         map[string]string `json:"config"`
}

type Endpoint struct {
	InternalIP string `json:"internalIP"`
	Port       int32  `json:"port"`
	NodePort   int32  `json:"nodePort"`
	Protocol   string `json:"protocol"`
	Host       string `json:"host"`
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
