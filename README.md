# EcoEvolution — 생태계 먹이그물 서바이벌

100종 생물 먹이그물을 기반으로 한 2D 실시간 멀티플레이 생존 게임입니다.  
데이터베이스 없이 Node.js 서버 인메모리(RAM)만 사용하며, 닉네임만 입력하면 즉시 플레이할 수 있습니다.

## 구조

```
mynature/
├── server/   # Node.js + Socket.io (인메모리 상태 관리)
└── client/   # Next.js + HTML5 Canvas (2D 렌더링)
```

## 빠른 시작

### 1. 서버 실행

```bash
cd server
npm install
npm run dev
```

기본 포트: `http://localhost:4000`

### 2. 클라이언트 실행

```bash
cd client
npm install
npm run dev
```

기본 포트: `http://localhost:3000`

브라우저에서 `http://localhost:3000`에 접속 후 닉네임을 입력하고 시작하세요.  
여러 브라우저 창(또는 시크릿 창)을 열어 멀티플레이를 테스트할 수 있습니다.

### 환경 변수 (클라이언트)

배포 시 서버 주소가 다르면 `client/.env.local`에 아래 값을 설정합니다.

```
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.onrender.com
```

## 배포

- **서버**: Render.com Web Service (Node.js)로 `server/` 배포 (Start command: `node index.js`).
- **클라이언트**: Vercel에 `client/`를 배포 후 `educhip.kr` 도메인에 연결.

## 조작

- 이동: 방향키 또는 `W/A/S/D`
- 대시: `Shift` (짧은 시간 속도 증가, 쿨타임 있음)
- 일시정지/결과 창 확인: 사망 시 자동 표시

## 규칙 요약

- 접속 시 랜덤한 1차 소비자로 스폰됩니다.
- 생산자(식물/플랑크톤)나 나보다 한 단계 아래 생물을 먹으면 포만감이 오릅니다.
- 포만감이 100%가 되면 다음 단계 상위 소비자로 진화합니다.
- 나보다 상위 단계 생물과 닿으면 에너지가 깎이며, 0이 되면 게임 오버입니다.
