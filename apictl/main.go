// Copyright © 2016 National Data Service

package main

import (
	"github.com/nds-labs/apictl/cmd"
	"log"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	cmd.Execute()
}
