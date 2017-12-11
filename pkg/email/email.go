// Copyright © 2016 National Data Service
package email

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"html/template"
	"net/smtp"

	"github.com/golang/glog"
	api "github.com/ndslabs/apiserver/pkg/types"
)

type EmailHelper struct {
	Server        string
	port          int
	origin        string
	SupportEmail  string
	tls           bool
	WorkbenchName string
}

func NewEmailHelper(server string, port int, tls bool, supportEmail string, origin string, name string) (*EmailHelper, error) {

	return &EmailHelper{
		Server:        server,
		origin:        origin,
		port:          port,
		SupportEmail:  supportEmail,
		tls:           tls,
		WorkbenchName: name,
	}, nil
}

// Send email address verification message
func (s *EmailHelper) SendVerificationEmail(name string, address string, url string) error {

	data := struct {
		Name          string
		Link          string
		SupportEmail  string
		WorkbenchName string
	}{
		Name:          name,
		Link:          url,
		SupportEmail:  s.SupportEmail,
		WorkbenchName: s.WorkbenchName,
	}

	subject := "Email address verification"
	msg, err := s.parseTemplate("templates/verify-email.html", data)
	if err != nil {
		return err
	}
	_, err = s.sendEmail(address, subject, msg)
	if err != nil {
		return err
	}
	return nil
}

// Send email address verified
func (s *EmailHelper) SendVerifiedEmail(name string, address string) error {

	data := struct {
		Name          string
		SupportEmail  string
		WorkbenchName string
	}{
		Name:          name,
		SupportEmail:  s.SupportEmail,
		WorkbenchName: s.WorkbenchName,
	}

	subject := "Registration pending"
	msg, err := s.parseTemplate("templates/verified-email.html", data)
	if err != nil {
		return err
	}
	_, err = s.sendEmail(address, subject, msg)
	if err != nil {
		return err
	}
	return nil
}

// Send new account request email
func (s *EmailHelper) SendNewAccountEmail(account *api.Account, approveUrl string, denyUrl string) error {

	data := struct {
		Name          string
		Namespace     string
		Email         string
		Description   string
		Organization  string
		ApproveLink   string
		DenyLink      string
		SupportEmail  string
		Origin        string
		WorkbenchName string
	}{
		Name:          account.Name,
		Namespace:     account.Namespace,
		Email:         account.EmailAddress,
		Description:   account.Description,
		Organization:  account.Organization,
		ApproveLink:   approveUrl,
		DenyLink:      denyUrl,
		SupportEmail:  s.SupportEmail,
		Origin:        s.origin,
		WorkbenchName: s.WorkbenchName,
	}

	subject := "New account request"
	msg, err := s.parseTemplate("templates/new-account-request.html", data)
	if err != nil {
		return err
	}
	_, err = s.sendEmail(s.SupportEmail, subject, msg)
	if err != nil {
		return err
	}
	return nil
}

// Send approve/deny status email
func (s *EmailHelper) SendStatusEmail(name string, username string, address string, url string, nexturl string, approved bool) error {
	data := struct {
		Name          string
		Username      string
		Email         string
		Link          string
		ServiceLink   string
		SupportEmail  string
		WorkbenchName string
	}{
		Name:          name,
		Username:      username,
		Email:         address,
		Link:          url,
		ServiceLink:   nexturl,
		SupportEmail:  s.SupportEmail,
		WorkbenchName: s.WorkbenchName,
	}

	var subject string
	var template string
	if approved {
		subject = "Account approved"
		template = "templates/approved-email.html"
	} else {
		subject = "Account denied"
		template = "templates/denied-email.html"
	}

	msg, err := s.parseTemplate(template, data)
	if err != nil {
		return err
	}

	// Send notice to user
	_, err = s.sendEmail(address, subject, msg)
	if err != nil {
		return err
	}

	// Send copy to support
	_, err = s.sendEmail(s.SupportEmail, "CC "+subject, msg)
	if err != nil {
		return err
	}

	return nil
}

// Send password recovery email
func (s *EmailHelper) SendRecoveryEmail(name string, email string, recoveryUrl string, unapproved bool) error {

	data := struct {
		Name          string
		Email         string
		Link          string
		SupportEmail  string
		Unapproved    bool
		WorkbenchName string
	}{
		Name:          name,
		Email:         email,
		Link:          recoveryUrl,
		Unapproved:    unapproved,
		SupportEmail:  s.SupportEmail,
		WorkbenchName: s.WorkbenchName,
	}

	subject := s.WorkbenchName + " password recovery request"
	msg, err := s.parseTemplate("templates/recovery-request.html", data)
	if err != nil {
		return err
	}
	_, err = s.sendEmail(email, subject, msg)
	if err != nil {
		return err
	}
	return nil
}

// Send support email
func (s *EmailHelper) SendSupportEmail(name string, email string, messageType string, message string, anon bool) error {

	if anon {
		name = "anonymous"
		email = "anonymous"
	}
	data := struct {
		Name          string
		Email         string
		Type          string
		Message       string
		SupportEmail  string
		WorkbenchName string
	}{
		Name:          name,
		Email:         email,
		Type:          messageType,
		Message:       message,
		SupportEmail:  s.SupportEmail,
		WorkbenchName: s.WorkbenchName,
	}

	subject := s.WorkbenchName + " support request (" + messageType + ")"
	msg, err := s.parseTemplate("templates/support-request.html", data)
	if err != nil {
		return err
	}
	_, err = s.sendEmail(s.SupportEmail, subject, msg)
	if err != nil {
		return err
	}
	return nil
}

// HTML message helper
func (s *EmailHelper) sendEmail(to string, subject string, body string) (bool, error) {
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	from := "From: " + s.WorkbenchName + " Support <" + s.SupportEmail + ">\n"
	subject = "Subject: " + subject + "\n"
	msg := []byte(from + subject + mime + "\n" + body)

	glog.V(4).Infof("Sending email to %s %s\n%s", to, subject, body)

	c, err := smtp.Dial(fmt.Sprintf("%s:%d", s.Server, s.port))
	if err != nil {
		return false, err
	}

	defer c.Close()
	if s.tls {
		cfg := &tls.Config{
			InsecureSkipVerify: true,
			ServerName:         s.Server,
		}
		err = c.StartTLS(cfg)
		if err != nil {
			return false, err
		}
	}

	c.Mail(s.SupportEmail)
	c.Rcpt(to)

	wc, err := c.Data()
	if err != nil {
		return false, err
	}
	defer wc.Close()
	if _, err = wc.Write(msg); err != nil {
		return false, err
	}

	return true, nil
}

// Parse a template from disk
func (s *EmailHelper) parseTemplate(path string, data interface{}) (string, error) {
	t, err := template.ParseFiles(path)
	if err != nil {
		return "", err
	}
	buf := new(bytes.Buffer)
	if err = t.Execute(buf, data); err != nil {
		return "", err
	}
	return buf.String(), nil
}
