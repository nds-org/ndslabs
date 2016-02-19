package types

type Project struct {
	Id           string `json:"id"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	Namespace    string `json:"namespace"`
	StorageQuota int    `json:"storageQuota"`
	Password     string `json:"password"`
	EmailAddress string `json:"email"`
}

type ProjectList struct {
	Items []Project `json:"items"`
}

type Service struct {
	Key            string              `json:"key"`
	Label          string              `json:"label"`
	Description    string              `json:"description"`
	Maintainer     string              `json:"maintainer"`
	RequiresVolume bool                `json:"requiresVolume"`
	Tags           string              `json:"tags"`
	Dependencies   []ServiceDependency `json:"depends"`
}

type ServiceList struct {
	Items []Service `json:"items"`
}

type ServiceDependency struct {
	DependencyKey string `json:"key"`
	Required      bool   `json:"required"`
}

type Config struct {
	Key string `json:"key"`
}
