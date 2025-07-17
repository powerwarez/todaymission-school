import React from "react";
import QRCode from "qrcode";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  PDFDownloadLink,
  Font,
} from "@react-pdf/renderer";
import { StudentCreationResult } from "../types/index";
import { Button } from "../components/ui/button";
import { Download } from "lucide-react";

// 한글 폰트 등록
Font.register({
  family: "NotoSansKR",
  fonts: [
    {
      src: "https://fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Regular.woff2",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Bold.woff2",
      fontWeight: 700,
    },
  ],
});

interface StudentQRCodesPDFProps {
  students: StudentCreationResult[];
  schoolName: string;
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
  qrCodes: { [key: string]: string };
}> = ({ students, schoolName, qrCodes }) => (
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
            <Text style={styles.subtitle}>
              오늘의 미션 로그인
            </Text>
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
            <Text style={styles.qrToken}>
              로그인 코드:{" "}
              {student.qr_token.substring(0, 8)}...
            </Text>
          </View>

          <View style={styles.instructions}>
            <Text style={styles.instructionTitle}>
              로그인 방법
            </Text>
            <Text style={styles.instructionText}>
              1. 스마트폰으로 위의 QR 코드를 스캔하세요.
            </Text>
            <Text style={styles.instructionText}>
              2. 또는 "오늘의 미션" 사이트에서 QR 로그인을
              선택하세요.
            </Text>
            <Text style={styles.instructionText}>
              3. 카메라가 열리면 위의 QR 코드를 비춰주세요.
            </Text>
            <Text style={styles.instructionText}>
              4. 로그인이 완료되면 오늘의 미션을 확인할 수
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

const StudentQRCodesPDF: React.FC<
  StudentQRCodesPDFProps
> = ({ students, schoolName }) => {
  const [qrCodes, setQrCodes] = React.useState<{
    [key: string]: string;
  }>({});
  const [generating, setGenerating] = React.useState(true);

  React.useEffect(() => {
    const generateQRCodes = async () => {
      const codes: { [key: string]: string } = {};

      for (const student of students) {
        try {
          const qrData = JSON.stringify({
            token: student.qr_token,
            student_name: student.student_name,
          });

          const qrCodeDataURL = await QRCode.toDataURL(
            qrData,
            {
              width: 300,
              margin: 2,
              color: {
                dark: "#000000",
                light: "#ffffff",
              },
            }
          );

          codes[student.student_id] = qrCodeDataURL;
        } catch (err) {
          console.error("Error generating QR code:", err);
        }
      }

      setQrCodes(codes);
      setGenerating(false);
    };

    if (students.length > 0) {
      generateQRCodes();
    }
  }, [students]);

  if (generating) {
    return (
      <Button disabled>
        <Download className="mr-2 h-4 w-4" />
        QR 코드 생성 중...
      </Button>
    );
  }

  return (
    <PDFDownloadLink
      document={
        <QRCodeDocument
          students={students}
          schoolName={schoolName}
          qrCodes={qrCodes}
        />
      }
      fileName={`${schoolName}_학생_QR코드.pdf`}>
      {({ loading }) => (
        <Button disabled={loading}>
          <Download className="mr-2 h-4 w-4" />
          {loading
            ? "PDF 생성 중..."
            : "QR 코드 PDF 다운로드"}
        </Button>
      )}
    </PDFDownloadLink>
  );
};

export default StudentQRCodesPDF;
