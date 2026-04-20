import React, { useState } from "react";
import QRCode from "qrcode";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
  Font,
} from "@react-pdf/renderer";
import { StudentCreationResult } from "../types/index";
import { Button } from "../components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

// 한글 폰트 등록 (프로젝트 내 public/fonts 에서 자체 호스팅하여 CORS 이슈 방지)
Font.register({
  family: "NotoSansKR",
  fonts: [
    {
      src: `${window.location.origin}/fonts/NotoSansKR-Regular.ttf`,
      fontWeight: 400,
    },
    {
      src: `${window.location.origin}/fonts/NotoSansKR-Bold.ttf`,
      fontWeight: 700,
    },
  ],
});

interface StudentQRCodesPDFProps {
  students: StudentCreationResult[];
  schoolName: string;
  className?: string;
  consentChecked?: boolean;
  studentAppUrl?: string;
}

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "NotoSansKR",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  container: {
    width: "100%",
    maxWidth: 500,
    alignItems: "center",
  },
  header: {
    marginBottom: 20,
    textAlign: "center",
  },
  schoolName: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
    fontFamily: "NotoSansKR",
  },
  subtitle: {
    fontSize: 16,
    color: "#333",
    fontFamily: "NotoSansKR",
    marginBottom: 5,
  },
  qrCodeContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    alignItems: "center",
  },
  qrCode: {
    width: 200,
    height: 200,
    marginBottom: 15,
  },
  studentName: {
    fontSize: 24,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "NotoSansKR",
  },
  qrToken: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    fontFamily: "NotoSansKR",
    marginBottom: 5,
    display: "none",
  },
  instructions: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "#e8f5e9",
    borderRadius: 8,
    width: "100%",
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 10,
    fontFamily: "NotoSansKR",
    textAlign: "center",
  },
  instructionText: {
    fontSize: 12,
    lineHeight: 1.6,
    marginBottom: 8,
    fontFamily: "NotoSansKR",
  },
  warning: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#fff3e0",
    borderRadius: 8,
    width: "100%",
  },
  warningText: {
    fontSize: 11,
    color: "#e65100",
    textAlign: "center",
    fontFamily: "NotoSansKR",
    lineHeight: 1.4,
  },
});

// QR Code PDF Document Component
const QRCodeDocument: React.FC<{
  students: StudentCreationResult[];
  schoolName: string;
  className?: string;
  qrCodes: { [key: string]: string };
}> = ({ students, schoolName, className, qrCodes }) => (
  <Document>
    {students.map((student) => (
      <Page
        key={student.student_id}
        size="A4"
        style={styles.page}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.schoolName}>
              {schoolName}
            </Text>
            {className ? (
              <Text style={styles.subtitle}>
                {className} - 오늘의 미션 로그인
              </Text>
            ) : (
              <Text style={styles.subtitle}>
                오늘의 미션 로그인
              </Text>
            )}
          </View>

          <View style={styles.qrCodeContainer}>
            <Text style={styles.studentName}>
              {student.student_name}
            </Text>
            {qrCodes[student.student_id] && (
              <Image
                style={styles.qrCode}
                src={qrCodes[student.student_id]}
              />
            )}
          </View>

          <View style={styles.instructions}>
            <Text style={styles.instructionTitle}>
              로그인 방법
            </Text>
            <Text style={styles.instructionText}>
              1. 태블릿 카메라로 위의 QR 코드를 스캔하세요.
            </Text>
            <Text style={styles.instructionText}>
              2. 자동으로 오늘의 미션 사이트로 이동하면서
              로그인됩니다.
            </Text>
            <Text style={styles.instructionText}>
              3. 로그인이 완료되면 오늘의 미션을 확인할 수
              있어요!
            </Text>
          </View>

          <View style={styles.warning}>
            <Text style={styles.warningText}>
              ⚠️ 이 QR 코드는 본인만 사용하세요. 다른 친구와
              공유하지 마세요!
            </Text>
          </View>
        </View>
      </Page>
    ))}
  </Document>
);

const STUDENT_APP_URL = "https://todaymission.vercel.app";

const StudentQRCodesPDF: React.FC<
  StudentQRCodesPDFProps
> = ({
  students,
  schoolName,
  className,
  consentChecked = false,
  studentAppUrl = STUDENT_APP_URL,
}) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!consentChecked) {
      toast.error(
        "개인정보 이용 동의서를 모두 받았습니다를 체크해주세요."
      );
      return;
    }

    if (students.length === 0) {
      toast.error("다운로드할 학생이 없습니다.");
      return;
    }

    setLoading(true);

    try {
      const qrCodes: { [key: string]: string } = {};

      for (const student of students) {
        const loginUrl = `${studentAppUrl}?qr_token=${encodeURIComponent(student.qr_token)}`;

        const qrCodeDataURL = await QRCode.toDataURL(loginUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });

        qrCodes[student.student_id] = qrCodeDataURL;
      }

      const blob = await pdf(
        <QRCodeDocument
          students={students}
          schoolName={schoolName}
          className={className}
          qrCodes={qrCodes}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${schoolName}_학생_QR코드.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF 생성 오류:", err);
      toast.error("PDF 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      disabled={loading || !consentChecked}
      onClick={handleDownload}
      className={
        !consentChecked ? "opacity-50 cursor-not-allowed" : ""
      }>
      <Download className="mr-2 h-4 w-4" />
      {loading ? "PDF 생성 중..." : "학생 로그인 안내장 다운로드"}
    </Button>
  );
};

export default StudentQRCodesPDF;
