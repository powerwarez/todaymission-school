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
} from "@react-pdf/renderer";
import { StudentCreationResult } from "../types/index";
import { Button } from "../components/ui/button";
import { Download } from "lucide-react";

interface StudentQRCodesPDFProps {
  students: StudentCreationResult[];
  schoolName: string;
}

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    textAlign: "center",
  },
  schoolName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  grid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    marginBottom: 20,
    padding: 15,
    border: "1px solid #ddd",
    borderRadius: 8,
  },
  qrCode: {
    width: 150,
    height: 150,
    marginBottom: 10,
    alignSelf: "center",
  },
  studentName: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  qrToken: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    wordBreak: "break-all",
  },
  instructions: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  instructionText: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 5,
  },
});

// QR Code PDF Document Component
const QRCodeDocument: React.FC<{
  students: StudentCreationResult[];
  schoolName: string;
  qrCodes: { [key: string]: string };
}> = ({ students, schoolName, qrCodes }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.schoolName}>{schoolName}</Text>
        <Text style={styles.subtitle}>
          학생 로그인 QR 코드
        </Text>
      </View>

      <View style={styles.grid}>
        {students.map((student) => (
          <View
            key={student.student_id}
            style={styles.card}>
            {qrCodes[student.student_id] && (
              <Image
                style={styles.qrCode}
                src={qrCodes[student.student_id]}
              />
            )}
            <Text style={styles.studentName}>
              {student.student_name}
            </Text>
            <Text style={styles.qrToken}>
              코드: {student.qr_token.substring(0, 8)}...
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          사용 방법:
        </Text>
        <Text style={styles.instructionText}>
          1. 학생에게 자신의 QR 코드를 나눠주세요.
        </Text>
        <Text style={styles.instructionText}>
          2. 학생은 QR 코드를 스캔하거나 코드를 입력하여
          로그인합니다.
        </Text>
        <Text style={styles.instructionText}>
          3. 로그인 정보는 다음 해 3월 1일까지 유지됩니다.
        </Text>
      </View>
    </Page>
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
