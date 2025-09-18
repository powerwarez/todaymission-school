import React from "react";
import {
  LuBookOpen,
  LuUsers,
  LuCheck,
  LuDownload,
  LuSettings,
  LuTrendingUp,
  LuQrCode,
  LuClipboardCheck,
  LuInfo,
  LuTriangle,
  LuCircle,
} from "react-icons/lu";

const TeacherGuidePage: React.FC = () => {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: "var(--color-text-primary)" }}>
          사용 안내
        </h1>
        <p
          className="text-lg"
          style={{ color: "var(--color-text-muted)" }}>
          오늘의 미션 시스템을 처음 사용하시는 선생님을 위한
          가이드입니다.
        </p>
      </div>

      {/* 빠른 시작 가이드 */}
      <div className="bg-blue-50 rounded-xl p-6 mb-8">
        <div className="flex items-start mb-4">
          <LuBookOpen className="text-2xl text-blue-600 mr-3 mt-1" />
          <div className="flex-1">
            <h2
              className="text-xl font-bold mb-3"
              style={{
                color: "var(--color-text-primary)",
              }}>
              빠른 시작 가이드
            </h2>
            <p className="text-gray-600 mb-4">
              명렬표에서 이름을 복사해서 붙여 넣으면
              간편하게 학생 계정이 만들어져요!
              <br />
              선생님께서 학생 계정만 생성하면{" "}
              <span className="text-red-600 font-semibold">
                개인정보이용 동의서 양식
              </span>
              과{" "}
              <span className="text-red-600 font-semibold">
                학생 로그인 안내장
              </span>
              이 자동으로 생성됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 단계별 설정 가이드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Step 1 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
              1
            </div>
            <h3 className="text-lg font-bold">
              교사 계정 가입 및 로그인
            </h3>
          </div>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <LuCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
              <span>
                카카오 계정으로 간편하게 가입 및 로그인
              </span>
            </li>
            <li className="flex items-start">
              <LuCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
              <span>
                별도의 회원가입 절차 없이 바로 시작 가능
              </span>
            </li>
          </ul>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
              2
            </div>
            <h3 className="text-lg font-bold">
              학교 정보 등록
            </h3>
          </div>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <LuCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
              <span>
                첫 로그인 시 학교명과 담당 학급 정보 입력
              </span>
            </li>
            <li className="flex items-start">
              <LuCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
              <span>
                이 정보는 학생 로그인 안내장에 표시됩니다
              </span>
            </li>
          </ul>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
              3
            </div>
            <h3 className="text-lg font-bold">
              개인정보 이용 동의서 배포
            </h3>
          </div>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <LuDownload className="text-green-500 mt-1 mr-2 flex-shrink-0" />
              <span>
                학생 관리 페이지에서 개인정보 이용 동의서
                다운로드
              </span>
            </li>
            <li className="flex items-start">
              <LuCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
              <span>
                학부모님께 동의서 배포 및 서명 수령(오프라인
                보관)
              </span>
            </li>
          </ul>
        </div>

        {/* Step 4 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
              4
            </div>
            <h3 className="text-lg font-bold">
              학생 계정 생성
            </h3>
          </div>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <LuUsers className="text-green-500 mt-1 mr-2 flex-shrink-0" />
              <span>
                학생 관리 페이지에서 학생 추가 버튼 클릭
              </span>
            </li>
            <li className="flex items-start">
              <LuClipboardCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
              <span>
                명렬표의 이름을 복사하여 한 번에 여러 학생
                등록 가능
              </span>
            </li>
            <li className="flex items-start">
              <LuQrCode className="text-green-500 mt-1 mr-2 flex-shrink-0" />
              <span>
                각 학생별 고유 QR 코드가 자동으로 생성됩니다
              </span>
            </li>
          </ul>
        </div>

        {/* Step 5 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
              5
            </div>
            <h3 className="text-lg font-bold">
              일일 미션 설정
            </h3>
          </div>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <LuSettings className="text-green-500 mt-1 mr-2 flex-shrink-0" />
              <span>
                오늘의 미션 설정 메뉴에서 일일 미션 등록
              </span>
            </li>
            <li className="flex items-start">
              <LuCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
              <span>미션 제목, 설명, 시간 설정 가능</span>
            </li>
            <li className="flex items-start">
              <LuInfo className="text-green-500 mt-1 mr-2 flex-shrink-0" />
              <span>
                AI 미션 추천 기능으로 다양한 미션 아이디어
                제공
              </span>
            </li>
          </ul>
        </div>

        {/* Step 6 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
              6
            </div>
            <h3 className="text-lg font-bold">
              학생 로그인 안내장 배포
            </h3>
          </div>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <LuDownload className="text-green-500 mt-1 mr-2 flex-shrink-0" />
              <span>
                개인정보 동의서 체크 후 로그인 안내장
                다운로드
              </span>
            </li>
            <li className="flex items-start">
              <LuQrCode className="text-green-500 mt-1 mr-2 flex-shrink-0" />
              <span>
                각 학생별 QR 코드가 포함된 안내장 인쇄 및
                배포
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* 주요 기능 설명 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2
          className="text-xl font-bold mb-4"
          style={{ color: "var(--color-text-primary)" }}>
          주요 기능 소개
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <LuTrendingUp className="text-purple-500 text-xl mr-3 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">통계</h3>
              <p className="text-sm text-gray-600">
                학급 전체의 미션 완료율, 주간/월간 진도를
                한눈에 확인할 수 있습니다.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <LuSettings className="text-blue-500 text-xl mr-3 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">
                오늘의 미션 설정
              </h3>
              <p className="text-sm text-gray-600">
                매일 학생들이 수행할 미션을 설정하고 관리할
                수 있습니다.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="text-yellow-500 text-xl mr-3 mt-1">
              🏆
            </div>
            <div>
              <h3 className="font-semibold mb-1">
                도전과제 설정
              </h3>
              <p className="text-sm text-gray-600">
                주간 목표 달성 시 획득할 수 있는 배지를
                설정하여 동기부여를 높입니다.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <LuUsers className="text-green-500 text-xl mr-3 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">
                학생 관리
              </h3>
              <p className="text-sm text-gray-600">
                학생 계정 생성, QR 코드 발급, 개별 진도
                확인이 가능합니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 학생 사용 방법 */}
      <div className="bg-green-50 rounded-lg p-6 mb-8">
        <h2
          className="text-xl font-bold mb-4"
          style={{ color: "var(--color-text-primary)" }}>
          학생 사용 방법
        </h2>
        <div className="space-y-3">
          <div className="flex items-start">
            <span className="font-bold mr-2">1.</span>
            <span>
              학생용 페이지 접속:
              <a
                href="https://todaymission.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-blue-600 hover:underline">
                https://todaymission.vercel.app/
              </a>
            </span>
          </div>
          <div className="flex items-start">
            <span className="font-bold mr-2">2.</span>
            <span>
              QR 로그인 버튼 클릭 후 배포받은 QR 코드 스캔
            </span>
          </div>
          <div className="flex items-start">
            <span className="font-bold mr-2">3.</span>
            <span>오늘의 미션 확인 및 완료 체크</span>
          </div>
          <div className="flex items-start">
            <span className="font-bold mr-2">4.</span>
            <span>주간 목표 달성 시 배지 획득</span>
          </div>
        </div>
      </div>

      {/* 자주 묻는 질문 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2
          className="text-xl font-bold mb-4"
          style={{ color: "var(--color-text-primary)" }}>
          자주 묻는 질문
        </h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-start mb-2">
              <LuCircle className="text-blue-500 mr-2 mt-1" />
              <h3 className="font-semibold">
                학생이 QR 코드를 분실했어요.
              </h3>
            </div>
            <p className="text-gray-600 ml-6">
              학생 관리 페이지에서 해당 학생의 QR 코드를
              다시 다운로드하여 배포할 수 있습니다.
            </p>
          </div>
          <div>
            <div className="flex items-start mb-2">
              <LuCircle className="text-blue-500 mr-2 mt-1" />
              <h3 className="font-semibold">
                미션을 수정하거나 삭제하고 싶어요.
              </h3>
            </div>
            <p className="text-gray-600 ml-6">
              오늘의 미션 설정 페이지에서 미션 옆의
              수정/삭제 버튼을 클릭하여 변경할 수 있습니다.
            </p>
          </div>
          <div>
            <div className="flex items-start mb-2">
              <LuCircle className="text-blue-500 mr-2 mt-1" />
              <h3 className="font-semibold">
                학생 이름을 잘못 입력했어요.
              </h3>
            </div>
            <p className="text-gray-600 ml-6">
              현재는 학생 계정 삭제 후 다시 생성해야 합니다.
              삭제 시 해당 학생의 모든 기록이 삭제되니
              주의해주세요.
            </p>
          </div>
        </div>
      </div>

      {/* 주의사항 */}
      <div className="bg-red-50 rounded-lg p-6">
        <div className="flex items-start">
          <LuTriangle className="text-red-500 text-xl mr-3 mt-1" />
          <div>
            <h2
              className="text-xl font-bold mb-3"
              style={{
                color: "var(--color-text-primary)",
              }}>
              주의사항
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>
                • 이 교사용 로그인 페이지가 학생들에게
                노출되지 않도록 주의해주세요.
              </li>
              <li>
                • 개인정보 동의서를 먼저 받으신 후 학생
                계정을 생성해주세요.
              </li>
              <li>
                • 학생 계정 삭제 시 모든 활동 기록이 함께
                삭제되며 복구할 수 없습니다.
              </li>
              <li>
                • Chrome, Edge, Safari 브라우저 사용을
                권장합니다.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherGuidePage;
