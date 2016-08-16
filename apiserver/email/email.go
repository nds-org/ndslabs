// Copyright © 2016 National Data Service
package email

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"github.com/golang/glog"
	"html/template"
	"net/smtp"
)

type EmailHelper struct {
	server       string
	port         int
	supportEmail string
}

func NewEmailHelper(server string, port int, supportEmail string) (*EmailHelper, error) {

	//auth = smtp.PlainAuth("", "dhanush@geektrust.in", "password", "smtp.gmail.com")
	return &EmailHelper{
		server:       server,
		port:         port,
		supportEmail: supportEmail,
	}, nil
}

// Send email address verification message
func (s *EmailHelper) SendVerificationEmail(name string, address string, url string) error {

	data := struct {
		Name         string
		Link         string
		SupportEmail string
	}{
		Name:         name,
		Link:         url,
		SupportEmail: s.supportEmail,
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

func (s *EmailHelper) SendNewAccountEmail(name string, email string, desc string, approveUrl string, denyUrl string) error {

	data := struct {
		Name         string
		Email        string
		Description  string
		ApproveLink  string
		DenyLink     string
		SupportEmail string
	}{
		Name:         name,
		Email:        email,
		Description:  desc,
		ApproveLink:  approveUrl,
		DenyLink:     denyUrl,
		SupportEmail: s.supportEmail,
	}

	subject := "New account request"
	msg, err := s.parseTemplate("templates/new-account-request.html", data)
	if err != nil {
		return err
	}
	_, err = s.sendEmail(s.supportEmail, subject, msg)
	if err != nil {
		return err
	}
	return nil
}

func (s *EmailHelper) SendStatusEmail(name string, address string, url string, approved bool) error {
	data := struct {
		Name         string
		Link         string
		SupportEmail string
	}{
		Name:         name,
		Link:         url,
		SupportEmail: s.supportEmail,
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
	_, err = s.sendEmail(address, subject, msg)
	if err != nil {
		return err
	}
	return nil
}

func (s *EmailHelper) SendRecoveryEmail(name string, email string, recoveryUrl string) error {

	data := struct {
		Name         string
		Email        string
		Link         string
		SupportEmail string
	}{
		Name:         name,
		Email:        email,
		Link:         recoveryUrl,
		SupportEmail: s.supportEmail,
	}

	subject := "NDS Labs password recovery request"
	msg, err := s.parseTemplate("templates/recovery-request.html", data)
	if err != nil {
		return err
	}
	_, err = s.sendEmail(s.supportEmail, subject, msg)
	if err != nil {
		return err
	}
	return nil
}

// HTML message helper
func (s *EmailHelper) sendEmail(to string, subject string, body string) (bool, error) {
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	subject = "Subject: " + subject + "\n"
	msg := []byte(subject + mime + "\n" + body)

	glog.V(4).Infof("Sending email to %s %s", to, subject)

	c, err := smtp.Dial(fmt.Sprintf("%s:%d", s.server, s.port))
	if err != nil {
		return false, err
	}

	cfg := &tls.Config{
		InsecureSkipVerify: true,
		ServerName:         s.server,
	}

	defer c.Close()
	err = c.StartTLS(cfg)
	if err != nil {
		return false, err
	}
	c.Mail(s.supportEmail)
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
