# Proje Adı

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## İçindekiler

- [Proje Hakkında](#proje-hakkında)
- [Başlarken](#başlarken)
  - [Gereksinimler](#gereksinimler)
  - [Kurulum](#kurulum)
- [Kullanım](#kullanım)
- [Katkıda Bulunma](#katkıda-bulunma)
- [Lisans](#lisans)
- [İletişim](#iletişim)
- [Teşekkür](#teşekkür)
- [API Endpoints](#api-endpoints)
- [Development](#development)
- [Contributing](#contributing)

## Proje Hakkında

Bu proje, [Next.js](https://nextjs.org) kullanılarak oluşturulmuş bir web uygulamasıdır. Proje, modern web geliştirme tekniklerini kullanarak hızlı ve optimize edilmiş bir kullanıcı deneyimi sunmayı amaçlamaktadır.

## Başlarken

Bu bölüm, projenizi yerel ortamda nasıl kuracağınızı açıklar. Yerel bir kopya oluşturmak için aşağıdaki adımları izleyin.

### Gereksinimler

- Node.js
- npm veya yarn

### Kurulum

1. Depoyu klonlayın
   ```bash
   git clone https://github.com/your_username/repo_name.git
   ```
2. NPM paketlerini yükleyin
   ```bash
   npm install
   ```

## Kullanım

Geliştirme sunucusunu çalıştırmak için:

```bash
npm run dev
# veya
yarn dev
# veya
pnpm dev
# veya
bun dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açarak sonucu görebilirsiniz.

`app/page.tsx` dosyasını düzenleyerek sayfayı düzenlemeye başlayabilirsiniz. Dosyayı düzenledikçe sayfa otomatik olarak güncellenir.

## Katkıda Bulunma

Katkılar, açık kaynak topluluğunu öğrenmek, ilham almak ve yaratmak için harika bir yer haline getirir. Yaptığınız katkılar **büyük ölçüde takdir edilmektedir**.

1. Projeyi çatallayın
2. Özellik Dalınızı Oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi İşleyin (`git commit -m 'Add some AmazingFeature'`)
4. Dala İtin (`git push origin feature/AmazingFeature`)
5. Bir Çekme İsteği Açın

## Lisans

MIT Lisansı altında dağıtılmaktadır. Daha fazla bilgi için `LICENSE` dosyasına bakın.

## İletişim

For questions or suggestions, please contact [your.email@example.com](mailto:your.email@example.com).

## Teşekkür

- Thanks to the teams behind [Next.js](https://nextjs.org), [Tailwind CSS](https://tailwindcss.com), and [LDAP](https://ldap.com) for their amazing tools and documentation.
- Inspired by the need for robust integrations between legacy systems and modern web interfaces.

## API Endpoints

- **Login API** - `POST /api/auth/login`  
  Request Body:  
  ```json
  {
    "username": "user",
    "password": "pass"
  }
  ```  
  Response: Session cookie and authentication status.

- **Get Users API** - `GET /api/users/get-users`  
  Requires a valid session cookie. Returns a list of users in Active Directory.

- **Edit User API** - `PATCH /api/users/edit-user`  
  Request Body:
  ```json
  {
    "userPrincipalName": "user@example.com",
    "cn": "User Name",
    "sAMAccountName": "username",
    "groups": ["Group1", "Group2"]
  }
  ```  
  Response: Success or failure message.

- **Delete User API** - `DELETE /api/users/delete-user`  
  Request Body:
  ```json
  {
    "userId": "username"
  }
  ```  
  Response: Confirmation message of user deletion.

## Development

- **Tailwind CSS**: Customize your styling in `tailwind.config.ts` and `src/app/globals.css`.
- **TypeScript & ESLint**: Enforced for type safety and code quality.
- **Hot Reloading**: Changes in `src/app` will reflect immediately during development.

## Contributing

Contributions are welcome! Follow these steps to contribute:

1. Fork the repository.
2. Create a new branch:  
   ```bash
   git checkout -b feature/YourFeature
   ```
3. Commit your changes:  
   ```bash
   git commit -m "Add feature description"
   ```
4. Push to your branch:  
   ```bash
   git push origin feature/YourFeature
   ```
5. Open a Pull Request detailing your changes.

Please follow the project's code style and commit guidelines.
