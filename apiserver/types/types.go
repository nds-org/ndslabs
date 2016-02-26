package types

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
	Endpoints   []string `json:"endpoints"`
	CreatedTime int      `json:"createdTime"`
	UpdatedTime int      `json:"updateTime"`
}

type Volume struct {
	Id          string `json:"id"`
	Size        int    `json:"size"`
	Format      string `json:"format"`
	AttachedTo  string `json:"attachedTo"`
	Service     string `json:"service"`
	Status      string `json:"status"`
	Formatted   bool   `json:"formatted"`
	CreatedTime int    `json:"createdTime"`
	UpdatedTime int    `json:"updateTime"`
}
