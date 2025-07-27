import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { LuSparkles, LuPlus, LuRefreshCw, LuTrash2 } from "react-icons/lu";
import {
  recommendMissions,
  RecommendedMission,
} from "../utils/geminiMissionRecommender";
import { toast } from "react-hot-toast";

interface AIMissionRecommendModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingMissions: string[];
  onAddMission: (content: string) => Promise<void>;
}

const AIMissionRecommendModal: React.FC<AIMissionRecommendModalProps> = ({
  isOpen,
  onClose,
  existingMissions,
  onAddMission,
}) => {
  const [recommendations, setRecommendations] = useState<RecommendedMission[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [addingMissionIndex, setAddingMissionIndex] = useState<number | null>(
    null
  );

  // AI 추천 받기
  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const result = await recommendMissions(existingMissions);
      if (result && result.length > 0) {
        setRecommendations(result);
        toast.success("AI가 미션을 추천했습니다!");
      } else {
        toast.error("미션 추천에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("추천 오류:", error);
      toast.error("미션 추천 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 모달이 열릴 때 자동으로 추천 받기
  React.useEffect(() => {
    if (isOpen && recommendations.length === 0) {
      fetchRecommendations();
    }
  }, [isOpen]);

  // 미션 추가
  const handleAddMission = async (
    mission: RecommendedMission,
    index: number
  ) => {
    setAddingMissionIndex(index);
    try {
      await onAddMission(mission.content);

      // 추가된 미션을 목록에서 제거
      setRecommendations((prev) => prev.filter((_, i) => i !== index));

      toast.success("미션이 추가되었습니다!");
    } catch (error) {
      console.error("미션 추가 오류:", error);
      toast.error("미션 추가에 실패했습니다.");
    } finally {
      setAddingMissionIndex(null);
    }
  };

  // 특정 추천 제거
  const handleRemoveRecommendation = (index: number) => {
    setRecommendations((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LuSparkles className="text-yellow-500" />
            오늘의 미션 AI 추천
          </DialogTitle>
          <DialogDescription>
            AI가 추천하는 교육적이고 건전한 미션들입니다. 원하는 미션을 선택해
            추가하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">AI가 미션을 생각하고 있어요...</p>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((mission, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {mission.content}
                    </p>
                    {mission.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {mission.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveRecommendation(index)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <LuTrash2 size={16} />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAddMission(mission, index)}
                      disabled={addingMissionIndex === index}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {addingMissionIndex === index ? (
                        <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></span>
                      ) : (
                        <>
                          <LuPlus className="mr-1" size={16} />
                          추가
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">추천된 미션이 없습니다.</p>
              <Button
                onClick={fetchRecommendations}
                variant="outline"
                className="mx-auto"
              >
                <LuRefreshCw className="mr-2" size={16} />
                다시 추천받기
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            onClick={fetchRecommendations}
            disabled={loading}
            variant="outline"
          >
            <LuRefreshCw
              className={`mr-2 ${loading ? "animate-spin" : ""}`}
              size={16}
            />
            다시 추천
          </Button>
          <Button onClick={onClose} variant="ghost">
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIMissionRecommendModal;
