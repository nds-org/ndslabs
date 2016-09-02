// Copyright © 2016 National Data Service
package crypto

import (
	"crypto/rand"
	"crypto/sha1"
	"encoding/base64"
	"github.com/kless/osutil/user/crypt"
	"github.com/kless/osutil/user/crypt/apr1_crypt"
)

type CryptoHelper struct {
	apr1Crypt crypt.Crypter
}

func NewCryptoHelper() *CryptoHelper {
	return &CryptoHelper{
		apr1Crypt: apr1_crypt.New(),
	}
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

func (c *CryptoHelper) CompareHashAndPassword(hash string, password string) error {
	return c.apr1Crypt.Verify(hash, []byte(password))
}

func (c *CryptoHelper) APR1String(s string) (string, error) {
	hashed, err := c.apr1Crypt.Generate([]byte(s), []byte{})
	if err != nil {
		return "", err
	}

	return hashed, nil
}
