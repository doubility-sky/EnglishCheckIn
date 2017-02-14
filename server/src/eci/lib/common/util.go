package common

import (
	"bytes"
	"crypto/des"
	"crypto/md5"
	crand "crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"fmt"
	"io/ioutil"
	mrand "math/rand"
	"os"
	"strconv"
	"time"
)

var (
	defaultDesKey []byte
)

func UtilInit() {
	mrand.Seed(time.Now().UnixNano())
	defaultDesKey = []byte("12345678")
}

func readRSAPublicKey(path string) *rsa.PublicKey {
	fi1, err := os.Open(path)
	if err != nil {
		panic(err)
	}
	defer fi1.Close()
	content, _ := ioutil.ReadAll(fi1)
	block, _ := pem.Decode(content)
	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		panic("Failed to parse RSA public key:")
	}
	result, _ := pub.(*rsa.PublicKey)
	return result
}

func readRSAPrivateKey(path string) *rsa.PrivateKey {
	fi, err := os.Open(path)
	if err != nil {
		panic(err)
	}
	defer fi.Close()
	content, _ := ioutil.ReadAll(fi)
	block, _ := pem.Decode(content)
	priv, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		panic("private key error!")
	}
	return priv
}

func RandomString(n int) []byte {
	buf := make([]byte, n)
	_, err := crand.Read(buf)
	if err != nil {
		return nil
	}
	return buf
}

func RandomVisibleString(n int) string {
	const letterBytes = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

	b := make([]byte, n)
	for i := range b {
		b[i] = letterBytes[mrand.Intn(len(letterBytes))]
	}
	return string(b)
}

func Base64Encode(src []byte) string {
	return base64.StdEncoding.EncodeToString(src)
}

func Base64Decode(src string) ([]byte, error) {
	return base64.StdEncoding.DecodeString(src)
}

func DesEncode(src []byte, key []byte) []byte {
	if key == nil {
		key = defaultDesKey
	}

	block, err := des.NewCipher(key)
	if err != nil {
		return nil
	}

	bs := block.BlockSize()
	padding := bs - len(src)%bs
	src = append(src, byte(0x80))
	src = append(src, bytes.Repeat([]byte{byte(0)}, padding-1)...)

	var dst []byte = make([]byte, len(src))
	for i := 0; i < len(src); i = i + bs {
		block.Encrypt(dst[i:], src[i:i+bs])
	}
	return dst
}

func DesDecode(src []byte, key []byte) []byte {
	if key == nil {
		key = defaultDesKey
	}

	block, err := des.NewCipher(key)
	if err != nil {
		return nil
	}

	bs := block.BlockSize()
	if len(src)%bs != 0 {
		return nil
	}

	var dst []byte = make([]byte, len(src))
	for i := 0; i < len(src); i = i + bs {
		block.Decrypt(dst[i:], src[i:i+bs])
	}

	for i := len(dst) - 1; i >= 0; i = i - 1 {
		if dst[i] == byte(0x80) {
			dst = dst[:i]
			break
		}
	}
	return dst
}

func MD5(src string) string {
	ret := md5.Sum([]byte(src))
	return fmt.Sprintf("%X", ret)
}

func FromHex(src []byte) []byte {
	dst := make([]byte, len(src)/2)
	for i := 0; i < len(src); i = i + 2 {
		b, _ := strconv.ParseUint(string(src[i:i+2]), 16, 8)
		dst[i/2] = byte(b)
	}
	return dst
}

func ToHex(src []byte) string {
	return fmt.Sprintf("%X", src)
}

func GetUTCForDB(unix int64) string {
	if unix <= 0 {
		return time.Now().UTC().Format("2006-01-02 15:04:05")
	} else {
		return time.Unix(unix, 0).UTC().Format("2006-01-02 15:04:05")
	}
}
