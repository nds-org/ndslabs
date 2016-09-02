package validate

import (
	"fmt"
	"github.com/golang/glog"
	api "github.com/ndslabs/apiserver/pkg/types"
	"github.com/xeipuuv/gojsonschema"
)

type Validator struct {
	schemaLoader gojsonschema.JSONLoader
}

func NewValidator(schema string) *Validator {
	v := new(Validator)
	v.schemaLoader = gojsonschema.NewReferenceLoader("file://" + schema)
	return v
}

func (v *Validator) ValidateSpec(spec *api.ServiceSpec) (bool, error) {
	glog.V(4).Infof("Validating %s\n", spec.Key)

	specLoader := gojsonschema.NewGoLoader(spec)

	result, err := gojsonschema.Validate(v.schemaLoader, specLoader)
	if err != nil {
		return false, err
	}

	if result.Valid() {
		return true, nil
	} else {
		msg := ""
		for _, desc := range result.Errors() {
			msg += fmt.Sprintf("- %s\n", desc)
		}
		glog.V(4).Infof("%s\n", msg)
		return false, fmt.Errorf("The spec is not valid:\n %s", msg)
	}
	return false, nil
}
