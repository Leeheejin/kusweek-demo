# KUSWEEK — 취향에서 시작하는 한 벌

“Kustom your week / 나의 일상을 커스텀하다”를 바탕으로, 가상샘플을 보며 시작한 대화가 제작 가능한 제안으로 이어지는 서비스 비전 웹사이트입니다.

## 경험의 구조

‘발견·요구사항·제안형 수주’를 동등한 단계로 나열하지 않습니다. 가상샘플은 고객이 취향을 구체화하는 접점이며, 제안형 수주는 그 대화를 CAD와 제조 역량으로 구체화해 고객에게 돌려주는 영업 방식입니다. AI는 요청 정리, 설계 변경 초안과 기록 재사용에 녹아 있습니다.

같은 셔츠의 곡면을 회전시키고, 선과 반투명 면으로 해체해 패턴 필드로 펼칩니다. 사이즈를 바꾸면 치수와 패턴 폭이 달라집니다. 선택한 핏과 컬러는 제안에 유지됩니다. 모든 동작은 페이지 내 시연이며 실제 주문, CAD 출력, 생산 시스템 호출은 없습니다.

## 자료 반영

- KUSWEEK 브랜드 블루, 열린 프레임 모티브, Kustom your week.
- 2027 SS Soft Utility: 셔츠 구조에서 워크셔츠·오버셔츠·라이트 셔켓으로 확장.
- 기존 셔츠의 95–135 사이즈, 일반핏·슬림핏과 제공된 cm 치수. 셔켓용 완성 치수와 구분.
- 원본 슬림핏 135 소매길이의 의심 값은 추정해 고치지 않고 ‘확인 중’으로 표시.
- 이미 도입된 CAD와 패턴·재단·봉제·완성검품을 기반으로 새 경험을 제안.
- 디자인 방향, 작업지시서, 실물 샘플, CLO 디지털트윈, 룩북과 운영 교육의 연결.

PDF 원문, 기업진단 점수·개인명·원가 자료는 공개물에 포함하지 않습니다. 제품 이미지는 AI 생성 콘셉트이며 실제 판매 제품으로 표시하지 않습니다.

## 실제로 검토한 모션 레퍼런스

- [84—24](https://84-24.org/): 회전과 위치 이동이 연결되는 와이어프레임. [제작자 설명](https://tympanus.net/codrops/2024/04/08/case-study-84-24/)에서 솔리드/와이어프레임 전환과 분해 구성 확인.
- [Shaders on Scroll](https://tympanus.net/Tutorials/ShadersOnScroll/): 밀도 높은 메쉬와 스크롤에 연동한 변형, 화면 전체의 색면 전환. [제작자 설명](https://tympanus.net/codrops/2021/07/13/rock-the-stage-with-a-smooth-webgl-shader-transformation-on-scroll/).
- [Lusion WebGL Scroll Sync](https://webgl-scroll-sync.lusion.co/): 스크롤 이동에 맞춘 큰 타이포와 시각 요소의 정렬.
- [revfactory/showreel](https://github.com/revfactory/showreel): 반복 모티브, 매치 컷, 큰 구도 변화, 가역적인 모션 수학. 일부 보간 함수의 MIT 고지 포함.

레퍼런스의 자산과 코드를 복제하지 않았습니다. 의류의 곡면과 패턴은 새로 작성한 절차적 시각 도식이며 실제 재단용 데이터가 아닙니다. 기존 3D 모델도 사용하지 않습니다.

## 실행 및 구성

저장소 루트의 `index.html`은 이미지·폰트·코드를 내장한 독립 실행 파일입니다. 서버 없이 열거나 GitHub Pages에서 실행할 수 있습니다.

소스 ZIP은 `index.html`, `style.css`, `app.js`, `atelier.js`, `motion.js`, `assets.js`, `assets/`로 구성됩니다. 소스 버전은 정적 HTTP 서버에서 실행합니다. `atelier.js`는 Canvas 2D의 원근 투영으로 선과 곡면을 그립니다. 프레임은 스크롤 위치의 함수이며 역방향에서도 동일하게 복원됩니다. 연속 자동 재생 없이 스크롤·선택·화면 크기 변경 시 렌더링하며 DPR은 1.6으로 제한합니다. 모션 감소 설정을 존중합니다.

폰트: Pretendard Variable (SIL Open Font License). 보간 함수: showreel MIT. 로고·브랜드·생성 이미지에 별도의 오픈소스 라이선스를 부여하지 않습니다.

개발용 빌드: Node.js 환경에서 `npm install`, `npm run build`, `npm test`. `dist/index.html` 하나를 정적 호스팅하면 됩니다.
