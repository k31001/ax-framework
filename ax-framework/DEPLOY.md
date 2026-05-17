# 배포 안내

이 폴더를 GitHub에 올리고 GitHub Pages로 서비스하는 절차입니다.

## 1단계 — GitHub에 새 레포 생성

[github.com/new](https://github.com/new) 에서:

- **Repository name**: `ax-framework` (원하는 이름 가능)
- **Public** 선택 (GitHub Pages 무료 사용을 위해)
- README, .gitignore, license는 **추가하지 않음** (이미 포함됨)
- **Create repository** 클릭

## 2단계 — 로컬에서 푸시

이 폴더 안에서 다음 명령을 순서대로 실행하세요. `<YOUR-USERNAME>`을 본인 GitHub 아이디로 바꾸시면 됩니다.

```bash
git init
git add .
git commit -m "Initial commit: AX Framework v1.0"
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/ax-framework.git
git push -u origin main
```

처음 푸시할 때 인증을 요구하면 GitHub Personal Access Token을 사용하시면 됩니다. ([토큰 생성 방법](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens))

## 3단계 — GitHub Pages 활성화

푸시 후 GitHub 웹사이트에서:

1. 레포 페이지 → 상단 **Settings** 탭
2. 좌측 사이드바 → **Pages**
3. **Source**: `Deploy from a branch` 선택
4. **Branch**: `main` 선택, 폴더는 `/ (root)` 선택
5. **Save** 클릭

1~2분 기다리면 다음 주소에서 라이브 페이지를 확인할 수 있습니다:

```
https://<YOUR-USERNAME>.github.io/ax-framework/
```

## 트러블슈팅

**404가 나올 때**
- Pages 빌드가 끝났는지 Actions 탭에서 확인
- 첫 배포는 5분까지 걸릴 수 있음

**스타일이 깨질 때**
- `index.html`에서 CSS/JS 경로가 상대 경로(`styles.css`, `script.js`)인지 확인 — 이미 그렇게 되어 있음
- `.nojekyll` 파일이 루트에 있는지 확인 (이미 포함됨)

**커스텀 도메인을 쓰고 싶을 때**
- Pages 설정 페이지 하단 **Custom domain**에 도메인 입력
- DNS 레코드는 [공식 가이드](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) 참고

## 업데이트 푸시

이후 내용을 수정했다면:

```bash
git add .
git commit -m "Update: <변경사항>"
git push
```

푸시 후 1~2분이면 Pages가 자동 재빌드됩니다.
