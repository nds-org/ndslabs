package types

type ServiceSpec struct {
	Key            string              `json:"key"`
	Label          string              `json:"label"`
	Description    string              `json:"description"`
	Maintainer     string              `json:"maintainer"`
	RequiresVolume bool                `json:"requiresVolume"`
	IsStack        bool                `json:"isStack"`
	IsService      bool                `json:"isService"`
	Dependencies   []ServiceDependency `json:"depends"`
	Config         map[string]string   `json:"config"`
	Image          string              `json:"image"`
	Ports          []Port              `json:"ports"`
	CreatedTime    int                 `json:"createdTime"`
	UpdatedTime    int                 `json:"updateTime"`
	ReadyProbe     ReadyProbe          `json:"readinessProbe"`
	VolumeMounts   []VolumeMount       `json:"volumeMounts"`
	Args           []string            `json:"args"`
	Command        []string            `json:"command"`
	IsPublic       bool                `json:"isPublic"`
}

type Port struct {
	Port     int    `json:"port"`
	Protocol string `json:"protocol"`
}

type VolumeMount struct {
	MountPath string `json:"mountPath"`
	Name      string `json:"name"`
}
type ReadyProbe struct {
	Path         string `json:"path"`
	Port         int    `json:"port"`
	InitialDelay int    `json:"initialDelay"`
	Timeout      int    `json:"timeout"`
}

type ProjectList struct {
	Items []Project `json:"items"`
}

type Project struct {
	Id           string `json:"id"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	Namespace    string `json:"namespace"`
	StorageQuota int    `json:"storageQuota"`
	EmailAddress string `json:"email"`
	Password     string `json:"password"`
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
	Id          string   `json:"id"`
	Stack       string   `json:"stack"`
	Service     string   `json:"service"`
	Status      string   `json:"status"`
	Endpoints   []string `json:"endpoints,omitempty"`
	CreatedTime int      `json:"createdTime"`
	UpdatedTime int      `json:"updateTime"`
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
