import React from "react";
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Font,
  pdf 
} from "@react-pdf/renderer";

// 한글 폰트 등록
Font.register({
  family: "NanumGothic",
  src: "https://cdn.jsdelivr.net/gh/wiziple/font-nanum@master/fonts/NanumGothic/NanumGothic.ttf",
});

// PDF 스타일
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "NanumGothic",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 30,
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 10,
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 10,
    color: "#374151",
  },
  paragraph: {
    fontSize: 12,
    lineHeight: 1.8,
    color: "#4b5563",
    marginBottom: 10,
  },
  list: {
    paddingLeft: 20,
    marginBottom: 10,
  },
  listItem: {
    fontSize: 12,
    lineHeight: 1.6,
    color: "#4b5563",
    marginBottom: 5,
  },
  infoTable: {
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  infoRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  infoLabel: {
    width: "30%",
    padding: 10,
    backgroundColor: "#f9fafb",
    fontSize: 12,
    fontWeight: 600,
    color: "#374151",
  },
  infoValue: {
    width: "70%",
    padding: 10,
    fontSize: 12,
    color: "#4b5563",
  },
  signatureSection: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
  },
  signatureText: {
    fontSize: 12,
    color: "#4b5563",
    marginBottom: 30,
    textAlign: "center",
  },
  signatureLine: {
    marginTop: 10,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderColor: "#d1d5db",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  signatureItem: {
    width: "45%",
    fontSize: 12,
    color: "#6b7280",
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    textAlign: "center",
  },
  footerText: {
    fontSize: 10,
    color: "#9ca3af",
  },
});

// 개인정보 이용 동의서 문서 컴포넌트
const PrivacyConsentDocument: React.FC<{ 
  schoolName?: string;
  className?: string;
}> = ({ schoolName = "학교명", className = "학급명" }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>개인정보 수집·이용 동의서</Text>
        <Text style={styles.subtitle}>오늘의 미션 학습 관리 시스템</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. 개인정보 수집·이용 목적</Text>
        <Text style={styles.paragraph}>
          본 동의서는 '{schoolName}' 학생들이 '오늘의 미션' 학습 관리 시스템을 
          이용하기 위해 필요한 최소한의 개인정보를 수집·이용하는 것에 대한 동의를 
          받기 위함입니다.
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• 학습 미션 수행 및 관리</Text>
          <Text style={styles.listItem}>• 학습 진도 및 성취도 확인</Text>
          <Text style={styles.listItem}>• 교사-학생 간 학습 커뮤니케이션</Text>
          <Text style={styles.listItem}>• 학습 피드백 제공 및 관리</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. 수집하는 개인정보 항목</Text>
        <View style={styles.infoTable}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>필수 정보</Text>
            <Text style={styles.infoValue}>학교명, 학년, 반, 번호, 이름</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>자동 생성 정보</Text>
            <Text style={styles.infoValue}>학습 기록, 미션 수행 내역, 접속 일시</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. 개인정보의 보유 및 이용 기간</Text>
        <Text style={styles.paragraph}>
          수집된 개인정보는 해당 학년도 종료 후 1년간 보관하며, 이후 즉시 파기합니다.
          단, 법령에 의해 보관이 필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. 개인정보의 제3자 제공</Text>
        <Text style={styles.paragraph}>
          원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 
          다만, 다음의 경우에는 예외로 합니다:
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• 이용자가 사전에 동의한 경우</Text>
          <Text style={styles.listItem}>• 법령의 규정에 의거하는 경우</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. 동의 거부 권리 및 불이익</Text>
        <Text style={styles.paragraph}>
          개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 
          다만, 동의를 거부할 경우 '오늘의 미션' 서비스 이용이 제한될 수 있습니다.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. 개인정보 보호 책임자</Text>
        <Text style={styles.paragraph}>
          담당 교사: {className} 담임교사
        </Text>
      </View>

      <View style={styles.signatureSection}>
        <Text style={styles.signatureText}>
          위와 같이 개인정보를 수집·이용하는 것에 동의하십니까?
        </Text>
        <View style={styles.signatureLine}>
          <View style={styles.signatureItem}>
            <Text>학생 성명: _____________________</Text>
          </View>
          <View style={styles.signatureItem}>
            <Text>보호자 성명: _____________________</Text>
          </View>
        </View>
        <View style={styles.signatureLine}>
          <View style={styles.signatureItem}>
            <Text>서명: _____________________</Text>
          </View>
          <View style={styles.signatureItem}>
            <Text>서명: _____________________</Text>
          </View>
        </View>
        <View style={{marginTop: 20, alignItems: "center"}}>
          <Text style={{fontSize: 12, color: "#4b5563"}}>
            날짜: ______년 ______월 ______일
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {schoolName} - 오늘의 미션 학습 관리 시스템
        </Text>
      </View>
    </Page>
  </Document>
);

// PDF 다운로드 함수
export const downloadPrivacyConsentPDF = async (
  schoolName?: string,
  className?: string
) => {
  try {
    const blob = await pdf(
      <PrivacyConsentDocument schoolName={schoolName} className={className} />
    ).toBlob();
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `개인정보_이용_동의서_${schoolName || "학교"}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error("PDF 생성 오류:", error);
    return false;
  }
};

export default PrivacyConsentDocument;
