// Copyright © 2016 National Data Service
package crypto

import (
	"crypto/rand"
	"crypto/sha1"
	"encoding/base64"
	"golang.org/x/crypto/bcrypt"
)

type CryptoHelper struct {
}

func NewCryptoHelper() *CryptoHelper {
	return &CryptoHelper{}
}

func (c *CryptoHelper) HashString(s string) string {
	hash := sha1.New()
	hash.Write([]byte(s))
	sha := base64.RawURLEncoding.EncodeToString(hash.Sum(nil))
	return sha
}

func (c *CryptoHelper) GenerateRandomString(len int) (string, error) {

	b := make([]byte, len)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}

	return base64.URLEncoding.EncodeToString(b), err
}

// Bcrypt helper used for passwords
func (c *CryptoHelper) BcryptString(s string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(s), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashed), nil
}

// Bcrypt helper used for passwords
func (c *CryptoHelper) CompareHashAndPassword(hash string, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}
