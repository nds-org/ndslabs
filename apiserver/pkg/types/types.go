// Copyright ÃÂÃÂ© 2016 National Data Service
package types

type ServiceSpec struct {
	Id                   string              `json:"id"`
	Key                  string              `json:"key"`
	Label                string              `json:"label"`
	Description          string              `json:"description"`
	Logo                 string              `json:"logo"`
	Maintainer           string              `json:"maintainer"`
	Image                ServiceImage        `json:"image"`
	Display              string              `json:"display"`
	Access               AccessType          `json:"access"`
	Dependencies         []ServiceDependency `json:"depends"`
	Config               []Config            `json:"config"`
	Command              []string            `json:"command"`
	Args                 []string            `json:"args"`
	Ports                []Port              `json:"ports"`
	Repositories         []Repository        `json:"repositories"`
	CreatedTime          int                 `json:"createdTime"`
	UpdatedTime          int                 `json:"updateTime"`
	ReadyProbe           ReadyProbe          `json:"readinessProbe"`
	VolumeMounts         []VolumeMount       `json:"volumeMounts"`
	ResourceLimits       ResourceLimits      `json:"resourceLimits"`
	Catalog              string              `json:"catalog"`
	DeveloperEnvironment string              `json:"developerEnvironment"`
	Tags                 []string            `json:"tags"`
	Info                 string              `json:"info"`
	Privileged           bool                `json:"privileged"`
	AuthRequired         bool                `json:"authRequired"`
}

type ServiceImage struct {
	Registry string   `json:"registry"`
	Name     string   `json:"name"`
	Tags     []string `json:"tags"`
}

type Repository struct {
	URL  string         `json:"url"`
	Type RepositoryType `json:"type"`
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

type RepositoryType string

const (
	RepositoryGit RepositoryType = "git"
	RepositorySVN RepositoryType = "svn"
	RepositoryHG  RepositoryType = "hg"
)

type Config struct {
	Name        string `json:"name"`
	Value       string `json:"value"`
	Label       string `json:"label"`
	IsPassword  bool   `json:"isPassword"`
	CanOverride bool   `json:"canOverride"`
	UseFrom     string `json:"useFrom"`
	SetTo       string `json:"setTo"`
}

type Port struct {
	Port        int32  `json:"port"`
	Protocol    string `json:"protocol"`
	ContextPath string `json:"contextPath"`
}

type VolumeMount struct {
	Type        MountType `json:"type"`
	MountPath   string    `json:"mountPath"`
	Default     bool      `json:"default"`
	DefaultPath string    `json:"defaultPath"`
}

type MountType string

const (
	MountTypeDocker MountType = "docker"
)

type ReadyProbe struct {
	Type         string `json:"type"`
	Path         string `json:"path"`
	Port         int    `json:"port"`
	InitialDelay int32  `json:"initialDelay"`
	Timeout      int32  `json:"timeout"`
}

type AccountStatus string

const (
	AccountStatusUnverified AccountStatus = "unverified"
	AccountStatusUnapproved AccountStatus = "unapproved"
	AccountStatusApproved   AccountStatus = "approved"
	AccountStatusDenied     AccountStatus = "denied"
)

type AccountList struct {
	Items []Account `json:"items"`
}

type Account struct {
	Id              string                `json:"id"`
	Name            string                `json:"name"`
	Description     string                `json:"description"`
	Namespace       string                `json:"namespace"`
	EmailAddress    string                `json:"email"`
	Password        string                `json:"password"`
	ResourceLimits  AccountResourceLimits `json:"resourceLimits"`
	ResourceUsage   ResourceUsage         `json:"resourceUsage"`
	Status          AccountStatus         `json:"status"`
	Token           string                `json:"token"`
	Organization    string                `json:"organization"`
	Created         int64                 `json:"created"`
	LastLogin       int64                 `json:"lastLogin"`
	InactiveTimeout int                   `json:"inactiveTimeout"`
	NextURL         string                `json:"nexturl"`
}

type ResourceLimits struct {
	CPUMax        int `json:"cpuMax"`
	CPUDefault    int `json:"cpuDefault"`
	MemoryMax     int `json:"memMax"`
	MemoryDefault int `json:"memDefault"`
}
type AccountResourceLimits struct {
	CPUMax        int `json:"cpuMax"`
	CPUDefault    int `json:"cpuDefault"`
	MemoryMax     int `json:"memMax"`
	MemoryDefault int `json:"memDefault"`
	StorageQuota  int `json:"storageQuota"`
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
}

type Stack struct {
	Id          string         `json:"id"`
	Key         string         `json:"key"`
	Name        string         `json:"name"`
	Services    []StackService `json:"services"`
	Status      string         `json:"status"`
	CreatedTime int            `json:"createdTime"`
	UpdatedTime int            `json:"updateTime"`
	Secure      bool           `json:"secure"`
}

func (s *Stack) GetStackService(stackServiceId string) *StackService {
	for i := range s.Services {
		stackService := &s.Services[i]
		if stackService.Id == stackServiceId {
			return stackService
		}
	}
	return nil
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
	VolumeMounts   map[string]string `json:"volumeMounts"`
	InternalIP     string            `json:"internalIP"`
}

type Endpoint struct {
	Host     string `json:"host"`
	Port     int32  `json:"port"`
	NodePort int32  `json:"nodePort"`
	Protocol string `json:"protocol"`
	Path     string `json:"path"`
	URL      string `json:"url"`
}

type Vocabulary struct {
	Name  string `json:"name"`
	Terms []Term `json:"terms"`
}

type Term struct {
	Id         string `json:"id"`
	Name       string `json:"name"`
	Definition string `json:"definition"`
}

type SupportRequest struct {
	Type      SupportRequestType `json:"type"`
	Message   string             `json:"message"`
	Anonymous bool               `json:"anonymous"`
}

type SupportRequestType string

const (
	BugRequestType     SupportRequestType = "bug"
	WishRequestType    SupportRequestType = "wish"
	HelpRequestType    SupportRequestType = "help"
	CommentRequestType SupportRequestType = "comment"
)

type ContactInfo struct {
	SupportEmail string `json:"supportEmail"`
	GitterURL    string `json:"gitterURL"`
	GroupsURL    string `json:"groupsURL"`
}

type ExportPackage struct {
	Account Account `json:"account"`
}

type Dataset struct {
	Provider  string `json:"provider"`
	Type      string `json:"type"`
	Key       string `json:"key"`
	URL       string `json:"url"`
	LocalPath string `json:"localPath"`
}
