//통합테스트: 주문 크기 5로 설정, 아비트리지 임계앖 0.1 설정
export const orderSize = 5; // 주문 크기 (단위: TON)
export const interval = 30000; // 1분 ->30초 (단위시간)
export const arbitrageThreshold = 0.05; // 아비트리지 허용 임계값 (%)
export const closeThreshold = 0.03;
//export const closeThreshold = arbitrageThreshold / 2; //포지션 청산 임계값
