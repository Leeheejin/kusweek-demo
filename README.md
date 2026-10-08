# KUSWEEK — 상상이, 제작이 되다.

3D 가상샘플 → AI 기반 CAD 설계 → AX 제작 워크플로우라는 비전을 스크롤로 경험하는 콘셉트 웹사이트입니다.

## 페이지 구성

- 새로 제작한 의류 콘셉트 이미지 3종의 2.5D 연출
- 스크롤과 드래그 바에 연결된 다섯 장면
- 의류 이미지에서 패턴 전개 개념도로 이어지는 마스크 전환
- AI 초안, 전문가 검토, 실물 샘플, 생산으로 이어지는 AX 제작 비전
- 의류 컬렉션과 제안형 제작 브리프의 화면 예시
- 모바일 레이아웃, 키보드 장면 이동, 모션 줄이기 설정 지원

## 범위

비전을 소개하는 웹사이트입니다. 기존에 생성한 3D 모델은 사용하지 않습니다. 의류는 새로 생성한 이미지이며, 입체감은 이미지 레이어와 모션그래픽으로 연출했습니다. 실제 CAD 변환, 패턴 생성, 주문 접수, 생산 시스템 연결은 실행되지 않습니다. 데이터 입력과 외부 API 호출도 없습니다.

## 실행

`index.html` 하나에 이미지, 폰트, 스타일과 스크립트가 모두 들어 있습니다. 브라우저에서 직접 열거나 GitHub Pages로 제공할 수 있습니다. GitHub Pages는 `main` 브랜치의 `/ (root)`에서 게시합니다.

수정 가능한 원본 HTML·CSS·JavaScript·이미지는 `KUSWEEK-Vision-Source.zip`에 있습니다. ZIP의 원본 index.html은 같은 폴더의 스타일·스크립트·에셋과 함께 정적 서버로 실행합니다.

## 출처와 라이선스

- [revfactory/showreel](https://github.com/revfactory/showreel), commit `bf62d0bbcb306a5676f4a71be9119f2c1248bbaf`: 장면 구성, 마스크 전환, 2.5D 패럴랙스, 진행 위치에 따른 결정적 모션. 모션 수학 함수 일부를 웹사이트에 맞춰 재구성했습니다. MIT, `SHOWREEL-LICENSE.txt`.
- [Pretendard](https://github.com/orioncactus/pretendard) 1.3.9: SIL Open Font License, `PRETENDARD-LICENSE.txt`.
- KUSWEEK 로고와 브랜드 정보: 프로젝트 제공 자료.
- 의류 이미지 3종: 이 콘셉트 웹사이트를 위해 새로 AI 생성. 실존 판매 제품의 확정 사양이 아닙니다.

브랜드 자료와 생성 이미지에 별도 오픈소스 라이선스를 부여하지 않습니다. Apple과 제휴·후원 관계가 없습니다.
