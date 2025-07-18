import {
  Box,
  Button,
  Input,
  Select,
  Skeleton,
  useToast,
} from "@chakra-ui/react";
import Layout from "@/components/layouts/Layout";
import Title from "@/components/title/Title";
import { css } from "@emotion/css";
import axios from "axios";
import {
  CONVERT_SHOPPING_MALL_LIST,
  GIFTAWAY_CHANNEL_LIST,
} from "@/constants/convert";
import { GetStaticProps } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AiOutlineFileAdd } from "react-icons/ai";
// 사은품 지급 조건을 설정하고 엑셀 파일을 변환하는 컴포넌트
const Convert = () => {
  // i18n 번역 설정
  const { t } = useTranslation("convert");
  // 엑셀 파일 업로드 및 변환 관련 상태 관리
  const [file, setFile] = useState<File | null>(null);
  // 로딩 상태 및 스켈레톤 로딩 상태 관리
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // 스켈레톤 로딩 상태 관리
  const [isLoadedSkeleton, setIsLoadedSkeleton] = useState<boolean>(true);
  // 채널, 브랜드, 상품 코드 및 묶음 체크 상태 관리
  const [channel, setChannel] = useState<string>("");
  // 브랜드 선택 상태 관리
  const [brand, setBrand] = useState<string>("");
  // 토스트 메시지 표시를 위한 useToast 훅 사용
  const toast = useToast();

  const [productCode, setProductCode] = useState<string>("");
  const [bundleChk, setBundleChk] = useState<boolean>(false);
  const [fields, setFields] = useState<Field[]>([]);
  return (
    <Layout>
      <Box
        className={css`
          @media (max-width: 468px) {
            font-size: 8px;
          }
        `}
      >
        <Title title={t("title")} />
        <ConvertSelectComponent
          t={t}
          file={file}
          toast={toast}
          isLoading={isLoading}
          channel={channel}
          fields={fields}
          setFields={setFields}
          setChannel={setChannel}
          productCode={productCode}
          bundleChk={bundleChk}
          brand={brand}
          setFile={setFile}
          setBrand={setBrand}
          setIsLoading={setIsLoading}
          setIsLoadedSkeleton={setIsLoadedSkeleton}
        />
        <Box
          className={css`
            display: flex;
            justify-content: space-between;
          `}
        >
          <ConvertFileComponent
            file={file}
            setFile={setFile}
            toast={toast}
            isLoadedSkeleton={isLoadedSkeleton}
            t={t}
          />
          <Gift
            fields={fields}
            setFields={setFields}
            productCode={productCode}
            setProductCode={setProductCode}
            bundleChk={bundleChk}
            setBundleChk={setBundleChk}
          />
        </Box>
      </Box>
    </Layout>
  );
};
//채널 선택, 쇼핑몰 선택, 파일 업로드 및 변환 버튼을 포함하여 엑셀 파일 변환을 위한 UI를 제공
const ConvertSelectComponent = ({
  t,
  file,
  toast,
  isLoading,
  channel,
  fields,
  productCode,
  bundleChk,
  setChannel,
  brand,
  setFile,
  setBrand,
  setIsLoading,
  setIsLoadedSkeleton,
}: {
  t: any;
  file: any;
  toast: any;
  isLoading: boolean;
  channel: string;
  setChannel: Dispatch<SetStateAction<string>>;
  productCode: string;
  brand: string;
  bundleChk: boolean;
  setFile: Dispatch<SetStateAction<any>>;
  setBrand: Dispatch<SetStateAction<string>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setIsLoadedSkeleton: Dispatch<SetStateAction<boolean>>;
  fields: Field[];
  setFields: Dispatch<SetStateAction<Field[]>>;
}) => {
  // 채널 선택 : 고도몰 선택시 브랜드 초기화
  const onChangeChannel = useCallback(
    (channel: string) => {
      if (channel !== "godomall") {
        setBrand("");
      }
      setChannel(channel);
    },
    [setBrand, setChannel]
  );

  // 쇼핑몰 선택
  const onChangeSelectShoppingMall = useCallback(
    (brand: string) => {
      setBrand(brand);
    },
    [setBrand]
  );

  // 바이너리 파일을 Base64 Encode 문자열로 반환
  const fileToBase64 = useCallback(async (file: any) => {
    return new Promise((resolve: any, reject: any) => {
      const fileReader: any = new FileReader();

      fileReader.onload = () => {
        resolve(
          //"data:application/pdf;base64" 부분을 제외하고 base64 문자열만 반환
          fileReader?.result.slice(fileReader?.result.lastIndexOf(",") + 1)
        );
      };
      fileReader.onerror = (error: any) => {
        reject(error);
      };
      fileReader.readAsDataURL(file);
    });
  }, []);
  // 변환 된 엑셀 파일 다운로드
  const onClickExcelDownload = useCallback(async () => {
    const storedFields = localStorage.getItem("fields");

    // 로컬스토리지에 필드 정보가 없다면
    if (!storedFields) {
      toast({
        title: "필드 오류",
        description: "저장된 데이터가 없습니다",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    // 정규화
    // 입력한 값과 로컬스토리지의 값과 비교해서 저장하지 않고 다운로드 했을 때 저장 요구
    if (JSON.stringify(JSON.parse(storedFields)) !== JSON.stringify(fields)) {
      toast({
        title: "필드 오류",
        description: "필드 수정 후 저장해주세요",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    // 로컬스토리지 대이터 객체로 변환
    const parsedFields = JSON.parse(storedFields);
    // 필드 유효성 검사
    const isFieldsValid = (fields: Field[]): boolean => {
      return fields.every(
        (field) =>
          field.condition.trim() !== "" &&
          field.gifts.every(
            (gift) =>
              gift.giftName.trim() !== "" && gift.giftSkuCode.trim() !== ""
          )
      );
    };

    if (!isFieldsValid(parsedFields)) {
      toast({
        title: "필드 오류",
        description: "모든 필드를 작성해주세요.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (bundleChk && productCode == "") {
      toast({
        title: "상품코드 오류 ",
        description: "묶음 체크시 상품번호를 입력해주세요.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (channel === "") {
      toast({
        title: `${t("채널을 선택해주세요")}`,
        description: `${t("channel_error_description")}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (file === null) {
      toast({
        title: `${t("파일을 선택해주세요")}`,
        description: `${t("file_error_description")}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(true);
      setIsLoadedSkeleton(false);
      const base64 = await fileToBase64(file);

      //서버 요청
      const response = await axios({
        url: "/api/convertGift",
        method: "post",
        data: {
          channel: channel,
          file: base64,
          fields: parsedFields,
          productCode: productCode,
          bundleChk: bundleChk,
        },
        timeout: 5000,
      });

      const date = new Date(response.headers.date);
      const year = date.getFullYear();
      const month = ("0" + (date.getMonth() + 1)).slice(-2);
      const day = ("0" + date.getDate()).slice(-2);
      const hours = ("0" + date.getHours()).slice(-2);
      const minutes = ("0" + date.getMinutes()).slice(-2);
      const seconds = ("0" + date.getSeconds()).slice(-2);

      const dateString = year + month + day + hours + minutes + seconds;

      const responseData = response.data.file;
      const linksource = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${responseData}`;

      const tempLink = document.createElement("a");
      let filename = "";
      if (brand == "" || !brand) {
        filename = channel + "_" + dateString + ".xlsx";
      } else {
        filename = "b_to_c_" + brand + "_" + dateString + ".xlsx";
      }

      tempLink.style.display = "none";
      tempLink.href = linksource;
      tempLink.setAttribute("download", filename);
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      setFile(null);
      setIsLoading(false);
      setIsLoadedSkeleton(true);
      toast({
        title: `${t("convert_file_success_title")}`,
        description: `${t("convert_file_success_description")}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      return;
    } catch (error: any) {
      toast({
        title: error.response.data.msg,
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setIsLoadedSkeleton(true);
      setIsLoading(false);
      return;
    }
  }, [
    fields,
    bundleChk,
    productCode,
    channel,
    file,
    toast,
    t,
    setIsLoading,
    setIsLoadedSkeleton,
    fileToBase64,
    brand,
    setFile,
  ]);

  return (
    <Box
      className={css`
        padding: 1.5em 2em;
        background-color: #fff;
        border-radius: 10px;
        box-shadow: 0 0 1px #a39d9d;
        display: flex;
        justify-content: space-between;
        @media (max-width: 960px) {
          display: block;
        }
      `}
    >
      <Box
        className={css`
          width: 100%;
        `}
      >
        <Box
          className={css`
            display: flex;
            align-items: center;

            @media (max-width: 960px) {
              display: block;
            }
          `}
        >
          <Box
            className={css`
              font-size: 1em;
              font-weight: 400;
              width: 110px;
              min-width: 110px;
              @media (max-width: 960px) {
                width: auto;
                margin-bottom: 0.5em;
              }
            `}
          >
            {t("channel")}
          </Box>
          <Box
            className={css`
              width: 43em;
              @media (max-width: 960px) {
                width: 100%;
              }
            `}
          >
            <Select
              fontSize="1em"
              height="3em"
              borderRadius="0px"
              borderColor="#E2E8F0"
              _hover={{ borderColor: "#E2E8F0" }}
              _focusVisible={{ borderColor: "#E2E8F0" }}
              onChange={(e) => onChangeChannel(e.target.value)}
            >
              <option value="">{t("channel_placeholder")}</option>
              {GIFTAWAY_CHANNEL_LIST.map((list: any, listIndex: number) => {
                return (
                  <option key={listIndex} value={list.channel}>
                    {list.channel}
                  </option>
                );
              })}
            </Select>
          </Box>
        </Box>
        {channel === "GodoMall" && (
          <Box
            className={css`
              display: flex;
              align-items: center;
              margin-top: 1.5em;
              @media (max-width: 960px) {
                display: block;
              }
            `}
          >
            <Box
              className={css`
                font-size: 1em;
                font-weight: 400;
                width: 110px;
                min-width: 110px;
                @media (max-width: 960px) {
                  width: auto;
                  margin-bottom: 0.5em;
                }
              `}
            >
              {t("shop")}
            </Box>
            <Box
              className={css`
                width: 43em;
                @media (max-width: 960px) {
                  width: 100%;
                }
              `}
            >
              <Select
                disabled={isLoading}
                fontSize="1em"
                height="3em"
                borderRadius="0px"
                borderColor="#E2E8F0"
                _hover={{ borderColor: "#E2E8F0" }}
                _focusVisible={{ borderColor: "#E2E8F0" }}
                onChange={(e) => onChangeSelectShoppingMall(e.target.value)}
              >
                <option value="">{t("shop_placeholder")}</option>
                {CONVERT_SHOPPING_MALL_LIST.map(
                  (list: any, listIndex: number) => {
                    return (
                      <option key={listIndex} value={list.brand}>
                        {list.brand}
                      </option>
                    );
                  }
                )}
              </Select>
            </Box>
          </Box>
        )}
      </Box>
      <Box
        className={css`
          & > div {
            width: 9em;
            height: 5.289em;
            & > button {
              width: 100%;
              height: 100%;
              border-radius: 10px;
              font-size: 1.3em;
              font-weight: 600;
            }
          }
          @media (max-width: 960px) {
            width: 46em;
            display: flex;
            justify-content: space-between;
            & > div {
              width: 100%;
              height: 3.5em;
              & > button {
                border-radius: 0px;
              }
            }
            & > div:first-of-type {
              margin-top: 2em;
            }
          }
          @media (max-width: 960px) {
            width: 100%;
          }
        `}
      >
        <Box
          className={css`
            @media (max-width: 960px) {
              margin-top: 2em;
            }
          `}
        >
          <Button
            backgroundColor="#000"
            color="#fff"
            _hover={{ backgroundColor: "#000" }}
            _active={{ backgroundColor: "#000" }}
            isLoading={isLoading}
            onClick={onClickExcelDownload}
          >
            {t("transform")}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
// 파일 업로드 및 변환 컴포넌트
const ConvertFileComponent = ({
  file,
  setFile,
  toast,
  isLoadedSkeleton,
  t,
}: {
  file: any;
  setFile: Dispatch<SetStateAction<any>>;
  toast: any;
  isLoadedSkeleton: boolean;
  t: any;
}) => {
  const fileDropElement = useRef<any>(null);

  const onDragStartFileEvent = useCallback((e: any) => {
    e.preventDefault();
  }, []);

  const onDragExitFileEvent = useCallback((e: any) => {
    e.preventDefault();
    fileDropElement.current.classList.remove("dragover");
  }, []);

  const onDragLeaveFileEvent = useCallback((e: any) => {
    e.preventDefault();
    fileDropElement.current.classList.remove("dragover");
  }, []);

  const onDragOverFileEvent = useCallback((e: any) => {
    e.preventDefault();
    fileDropElement.current.classList.add("dragover");
  }, []);

  const onDropFileEvent = useCallback(
    (e: any) => {
      // 기본 동작 차단
      e.preventDefault();

      fileDropElement.current.classList.remove("dragover");
      // 파일 드롭 & 선택
      const files = e.target.files || e.dataTransfer.files;
      // 파일 크기 제한 설정 (12MB)
      const sizeLimit = 1024 ** 2 * 12;

      try {
        // 파일을 반드시 1개만 선택하도록 제한
        if (files.length !== 1) {
          toast({
            title: `${t("파일 에러")}`,
            description: `${t("반드시 한개의 파일만 선택해주세요")}`,
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          setFile(null);
          return;
        }
        // 파일 사이즈 제한
        if (sizeLimit < files[0].size) {
          toast({
            title: `${t("파일 사이즈 에러")}`,
            description: `${t("파일 사이즈는 12MB를 초과할 수 없습니다")}`,
            status: "error",
            duratin: 3000,
            isClosable: true,
          });
          setFile(null);
          return;
        }
        setFile(files[0]);
      } catch (error: any) {
        setFile(null);
        toast({
          title: error.code,
          description: error.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    },
    [setFile, t, toast]
  );

  return (
    <Skeleton
      isLoaded={isLoadedSkeleton}
      className={css`
        width: 49%;
      `}
    >
      <Box
        className={css`
          margin-top: 3em;
          background-color: #fff;
          border-radius: 10px;
          box-shadow: 0 0 1px #a39d9d;
          border: 1px dashed #a39d9d;
          font-size: 1em;
          height: 550px;
        `}
      >
        <Box
          className={css`
            width: 100%;
            height: 100%;
            & > label {
              width: 100%;
              height: 100%;
              display: table;
            }
            & > input {
              display: none;
            }
          `}
          onDragStart={onDragStartFileEvent}
          onDragExit={onDragExitFileEvent}
          onDragLeave={onDragLeaveFileEvent}
          onDragOver={onDragOverFileEvent}
          onDrop={onDropFileEvent}
          ref={fileDropElement}
        >
          <label htmlFor="input-file">
            <Box
              className={css`
                display: table-cell;
                vertical-align: middle;
                text-align: center;
                cursor: pointer;
              `}
            >
              <Box>
                <AiOutlineFileAdd
                  className={css`
                    font-size: 5em;
                    display: inline-block;
                  `}
                />
              </Box>
              <Box
                className={css`
                  margin-top: 1em;
                  font-size: 1.2em;
                `}
              >
                {file ? file?.name : `${t("upload_by_drag_drop_or_select")}`}
              </Box>
            </Box>
          </label>
          <Input
            type="file"
            id="input-file"
            required
            onChange={onDropFileEvent}
          />
        </Box>
      </Box>
    </Skeleton>
  );
};
// 사은품 지급 조건 및 사은품 정보 인터페이스
interface Gift {
  //사은품 이름
  giftName: string;
  // 사은품 SKU 코드(사은품 재고 관리 코드)
  giftSkuCode: string;
  // 사은품 수량
  giftQty: number | null;
}
// 사은품 지급 조건 필드 인터페이스
interface Field {
  condition: string;
  gifts: Gift[];
}

const Gift = ({
  fields,
  setFields,
  productCode,
  setProductCode,
  bundleChk,
  setBundleChk,
}: {
  fields: Field[];
  setFields: React.Dispatch<React.SetStateAction<Field[]>>;
  productCode: string;
  setProductCode: Dispatch<SetStateAction<string>>;
  bundleChk: boolean;
  setBundleChk: Dispatch<SetStateAction<boolean>>;
}) => {
  const toast = useToast();

  // useEffect 훅을 사용하여 컴포넌트가 마운트될 때 로컬스토리지에서 필드 정보를 가져오고 상태를 초기화합니다.
  useEffect(() => {
    // 로컬스토리지에서 필드 정보 가져오기
    const storedFields = localStorage.getItem("fields");
    // 로컬스토리지에 필드 정보가 있다면 해당 데이터를 파싱하여 fields 상태에 저장
    if (storedFields) {
      setFields(JSON.parse(storedFields));
    } else {
      // 로컬스토리지에 필드 정보가 없다면 기본 필드 설정
      setFields([
        {
          condition: "",
          gifts: [{ giftName: "", giftSkuCode: "", giftQty: null }],
        },
      ]);
    }
  }, [setFields]);
  // 새로 추가된 필드나 사은품 정보를 로컬스토리지에 저장
  const saveToLocalStorage = (updatedFields: Field[]) => {
    localStorage.setItem("fields", JSON.stringify(updatedFields));
  };
  // 사은품 지급 조건 필드 추가
  const addField = () => {
    setFields((prevFields) => {
      // 새 필드를 추가할 때 기존 필드들을 유지하면서 새로운 필드를 추가
      const updatedFields = [
        // 기존 fields를 복사
        ...prevFields,
        // 새로운 필드 추가
        {
          condition: "",
          gifts: [{ giftName: "", giftSkuCode: "", giftQty: null }],
        },
      ];
      return updatedFields;
    });
  };
  // 사은품 추가
  const addGift = (fieldIndex: number) => {
    // setFields()안의 콜백 함수에서 이전 상태를 받아와서 새로운 상태를 반환
    setFields((prevFields) => {
      const updatedFields = prevFields.map((field, i) =>
        // 추가 된 인덱스가 현재 인덱스와 같을 때만 gifts 배열에 새로운 사은품 객체를 추가
        i === fieldIndex
          ? {
              ...field,
              gifts: [
                ...field.gifts,
                { giftName: "", giftSkuCode: "", giftQty: null },
              ],
            }
          : // 일치하지 않는 경우 기존 필드를 그대로 반환
            field
      );
      return updatedFields;
    });
  };
  // 사은품 삭제
  const deleteGift = (fieldIndex: number, giftIndex: number) => {
    setFields((prevFields) => {
      const updatedFields = prevFields.map((field, i) =>
        i === fieldIndex
          ? {
              ...field,
              gifts:
                field.gifts.length === 1
                  ? field.gifts
                  : field.gifts.filter((_, index) => index !== giftIndex),
            }
          : field
      );
      return updatedFields;
    });
  };
  // 필드 삭제
  const deleteField = (fieldIndex: number) => {
    setFields((prevFields) =>
      prevFields.length !== 1
        ? prevFields.filter((_, i) => i !== fieldIndex)
        : prevFields
    );
  };
  // 필드 조건 변경
  const handleConditionChange = (index: number, value: string) => {
    setFields((prevFields) => {
      const updatedFields = prevFields.map((field, i) =>
        i === index ? { ...field, condition: value } : field
      );
      return updatedFields;
    });
  };
  // 사은품 조건 변경
  const handleGiftChange = (
    fieldIndex: number,
    giftIndex: number,
    key: keyof Gift,
    value: string
  ) => {
    if (key === "giftQty") {
      setFields((prevFields) =>
        prevFields.map((field, i) =>
          i === fieldIndex
            ? {
                ...field,
                gifts: field.gifts.map((gift, j) =>
                  j === giftIndex
                    ? {
                        ...gift,

                        [key]: value === "" ? null : parseInt(value, 10),
                      }
                    : gift
                ),
              }
            : field
        )
      );
    } else {
      // 다른 필드는 기존 로직 유지
      setFields((prevFields) =>
        prevFields.map((field, i) =>
          i === fieldIndex
            ? {
                ...field,
                gifts: field.gifts.map((gift, j) =>
                  j === giftIndex ? { ...gift, [key]: value } : gift
                ),
              }
            : field
        )
      );
    }
  };
  // 공백 제거
  const trimmedFields = fields.map((field) => ({
    ...field,
    condition: field.condition ? field.condition.trim() : "",
    gifts: field.gifts.map((gift) => ({
      ...gift,
      giftName: gift.giftName.trim(),
      giftSkuCode: gift.giftSkuCode.trim(),
      giftQty: gift.giftQty,
    })),
  }));
  // 필드 저장 클릭 시 유효 검증 완료 후 저장
  const handleSave = () => {
    if (!validateAllFields(trimmedFields)) {
      return; // 유효성 실패 → 저장하지 않음
    }

    saveToLocalStorage(trimmedFields); // 유효성 통과 → 저장
  };
  // 모든 필드 유효성 검사 함수
  const validateAllFields = (fields: Field[]): boolean => {
    for (const field of fields) {
      // 모든 필드 입력 필수
      if (field.condition.trim() === "") {
        toast({
          title: "필드 오류",
          description: "모든 필드를 작성해주세요.",
          status: "error",
          duration: 3000,
          isClosable: false,
        });
        return false;
      }
      // 사은품 지금 조건 금액 숫자만 입력 가능
      if (!/^[0-9]+$/.test(field.condition.trim())) {
        toast({
          title: "Validation Error",
          description: "사은품 지급조건금액은 숫자만 입력할 수 있습니다.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return false;
      }
      // 수량은 숫자만 입력 가능
      for (const gift of field.gifts) {
        if (
          gift.giftName.trim() === "" ||
          gift.giftSkuCode.trim() === "" ||
          gift.giftQty === null ||
          gift.giftQty < 1
        ) {
          toast({
            title: "Validation Error",
            description:
              "모든 사은품 정보를 정확히 입력해주세요 (수량은 1개 이상 숫자만 입력 가능).",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          return false;
        }
      }
    }
    // 모든 필드가 유효한 경우 로컬스토리지에 저장
    toast({
      title: "저장 완료",
      description: "저장되었습니다.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });

    return true;
  };
  // 필드 초기화 및 로컬 스토리지 필드 정보 제거
  const handleReset = () => {
    setFields([
      {
        condition: "",
        gifts: [{ giftName: "", giftSkuCode: "", giftQty: null }],
      },
    ]);
    //로컬스토리지 필드 remove
    localStorage.removeItem("fields");
  };

  // 파일 저장 버튼 클릭 시 로컬스토리지에 있는 필드 정보를 파일로 저장
  const handleFileSave = useCallback(() => {
    //로컬스토리지에 있는 필드 정보 가져오기
    const storedFields = localStorage.getItem("fields");

    //로컬스토리지에 필드 정보가 없다면
    if (!storedFields) {
      //에러메시지 출력
      toast({
        title: "필드 오류",
        description: "지급 조건 저장 후, 파일 저장 버튼을 눌러주세요.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    //로컬스토리지 문자열 => 바이트 배열로 변환 => base64로 인코딩
    const base64FieldsInfo = Buffer.from(storedFields, "utf-8").toString(
      "base64"
    );

    //base64로 인코딩된 필드 정보를 다운로드 확장자는 .cnf 다운로드 받게끔
    const blob = new Blob([base64FieldsInfo], { type: "text/plain" });
    const tempLink = document.createElement("a"); // a태그 생성 브라우저는 파일시스템에 접근하지못한다. a태그를 이용하여 다운로드
    tempLink.href = URL.createObjectURL(blob);
    tempLink.setAttribute("download", "giftCondition.cnf"); //download속성 a 태그 추가
    tempLink.click();
    URL.revokeObjectURL(tempLink.href);
  }, [toast]);
  // 업로드한 파일 을 로드하는 함수
  const handleFileLoad = useCallback(() => {
    //파일 로드시 파일을 읽어서 base64로 인코딩된 파일을 가져옴
    //파일 불러오면 2번 역순으로 처리  1. 파일을 읽어서 2. base64로 인코딩된 파일을 가져옴
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".cnf";
    fileInput.onchange = async (e: any) => {
      const file = e.target.files[0]; //fileList에서 0번째 파일

      const reader = new FileReader();

      //확장자 cnf아닐 경우 오류메시지 노출
      if (file.name.split(".").pop() !== "cnf") {
        toast({
          title: "지급 조건 파일 형식 오류",
          description: "cnf 파일만 업로드 가능합니다.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      reader.onload = async (e) => {
        const base64FieldsInfo = e.target?.result;

        //base64FieldsInfo를 디코딩
        const decodedFieldsInfo = Buffer.from(
          base64FieldsInfo as string,
          "base64"
        ).toString("utf-8");

        //디코딩된 정보가 json형식인지 판별
        if (!isJSON(decodedFieldsInfo)) {
          toast({
            title: "지급 조건 파일 형식 오류",
            description: "JSON형식이 아닙니다.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }

        const jsonData = JSON.parse(decodedFieldsInfo);

        if (jsonData.length === 0) {
          toast({
            title: "지급 조건 파일 형식 오류",
            description: "빈 파일입니다.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
        // 파일 내 지급조건 존재 여부
        for (const field of jsonData) {
          if (!field.condition) {
            toast({
              title: "지급 조건 파일 형식 오류",
              description: "지급 조건이 비어있습니다.",
              status: "error",
              duration: 3000,
              isClosable: true,
            });
            return;
          }
          for (const gift of field.gifts) {
            if (typeof gift.giftQty !== "number") {
              gift.giftQty = Number(gift.giftQty);
              if (typeof gift.giftQty != "number") {
                toast({
                  title: "지급 조건 파일 형식 오류",
                  description:
                    "지급 조건 수량의 형식 숫자 형식으로 되어있지 않습니다.",
                  status: "error",
                  duration: 3000,
                  isClosable: true,
                });
                return;
              }
            }
          }
        }

        const updatedFieldsInfo = JSON.stringify(jsonData);

        localStorage.setItem("fields", updatedFieldsInfo);
        setFields(JSON.parse(decodedFieldsInfo));
      };

      reader.readAsText(file);
    };
    fileInput.click();
  }, [setFields, toast]);

  //사은품 지급 좋건 상품코드
  const codeSave = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setProductCode(e.target.value);
    },
    [setProductCode]
  );
  // 묶음 체크박스 상태 저장
  const bundleChkSave = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setBundleChk(e.target.checked);
    },
    [setBundleChk]
  );

  // JSON 형식 판별 함수
  function isJSON(data: any) {
    try {
      // 데이터를 JSON으로 파싱 시도
      JSON.parse(data);
      return true; // 파싱 성공: JSON 형식
    } catch (error) {
      return false; // 파싱 실패: JSON 형식 아님
    }
  }

  return (
    <div
      className={css`
        margin-top: 3em;
        background-color: #fff;
        border-radius: 10px;
        box-shadow: 0 0 1px #a39d9d;
        border: 1px solid #a39d9d;
        font-size: 1em;
        height: 550px;
        width: 49%;
      `}
    >
      <div
        className={css`
          overflow: scroll;
          height: 100%;
          table {
            padding: 1em;
            width: 100%;
            input {
              width: 100%;
              text-align: center;
              cursor: text;

              &::placeholder {
                color: #9f9e9e;
                opacity: 0.5;
              }
            }
            td {
              height: 0px;
            }
            border-collapse: separate;
            .gifts {
              display: flex;
              padding: 0.1em;
              width: 100%;
              div {
                width: 100%;
              }
            }
          }
        `}
      >
        <div
          className={css`
            text-align: center;
            thead {
              background: lightgray;
              height: 3em;
              font-weight: bold;
              color: white;
            }
          `}
        >
          <div>
            <div
              className={css`
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                background: lightgray;
                height: 3em;
                color: white;
                font-weight: bold;
                margin: 1em 1em;
              `}
            >
              사은품 지급 조건 상품 코드 (상품번호 기입)
            </div>
            <div
              className={css`
                display: flex;
                justify-content: center;
                align-items: center;
                text-align: center;
                div {
                  width: 100%;
                }
              `}
            >
              <div>
                <input
                  className={css`
                    margin: 0 1em;
                    width: 70%;
                    text-align: center;
                    cursor: text;
                    border: 1px solid rgba(211, 211, 211, 1);
                    height: 2.5em;
                  `}
                  type="text"
                  placeholder="코드를 입력 해주세요"
                  value={productCode}
                  onChange={codeSave}
                />
                <input
                  type="checkbox"
                  checked={bundleChk}
                  onChange={bundleChkSave}
                />{" "}
                묶음
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <td>
                  <div>사은품 지급 조건금액(숫자기입)</div>
                </td>
                <td
                  colSpan={6}
                  className={css`
                    height: 100%;
                    .giftsHead {
                      display: flex;
                      div {
                        width: 100%;
                      }
                      .lastDiv {
                        width: 25%;
                      }
                    }
                  `}
                >
                  <div className="giftsHead">
                    <div>사은품 이름</div>
                    <div>SKU 코드</div>
                    <div>수량</div>
                    <div className="lastDiv"></div>
                  </div>
                </td>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, fieldIndex) => (
                <tr key={fieldIndex}>
                  <td
                    className={css`
                      .conditionCon {
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;

                        .conditionCon {
                          display: flex;
                          input {
                            margin: auto;
                            border: 1px solid rgba(211, 211, 211, 1);
                            padding: 0.3em;
                          }
                        }
                        .conditionBtn {
                          width: 100%;
                          background: white;
                        }
                      }
                    `}
                  >
                    <div className="conditionCon">
                      <div className="conditionCon">
                        <input
                          className="condition"
                          type="text"
                          placeholder="금액 입력(숫자)"
                          value={field.condition}
                          onChange={(e) =>
                            handleConditionChange(fieldIndex, e.target.value)
                          }
                        />
                      </div>
                      <div
                        className={css`
                          display: flex;
                          border: 1px solid lightgray;
                          width: 100%;
                          padding: 0.3em;
                          .conditionAddBtnDiv {
                            width: 50%;
                          }

                          .conditionBtn {
                            cursor: pointer;
                          }
                          .deleteBtn {
                            padding-right: 15px;
                            padding-left: 15px;
                            text-align: center;
                            cursor: pointer;
                          }
                          .conditionBtn {
                            background: white;
                          }
                        `}
                      >
                        {fieldIndex === fields.length - 1 ? (
                          <div
                            className={css`
                              width: 100%;
                              display: flex;
                              .deleteBtnDiv {
                                width: 50%;
                              }
                            `}
                          >
                            <div className="conditionAddBtnDiv">
                              <input
                                className="conditionBtn"
                                type="button"
                                value="+"
                                onClick={addField}
                              />
                            </div>
                            <div className="deleteBtnDiv">
                              <input
                                className="deleteBtn"
                                type="button"
                                value="-"
                                onClick={() => {
                                  deleteField(fieldIndex);
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div
                            className={css`
                              width: 100%;
                            `}
                          >
                            <div className="deleteBtnDiv">
                              <input
                                className="deleteBtn"
                                type="button"
                                value="-"
                                onClick={() => {
                                  deleteField(fieldIndex);
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td colSpan={6}>
                    <div
                      className={css`
                        padding-bottom: 10px;
                        padding-top: 10px;
                      `}
                    >
                      {field.gifts.map((gift, giftIndex) => (
                        <div
                          key={giftIndex}
                          className={css`
                            display: flex;
                            .gifts {
                              display: flex;
                              .giftDeleteBtnDiv {
                                width: 25%;
                                display: flex;
                                justify-content: center;
                                cursor: pointer;
                                .giftDeleteBtn {
                                  width: 80%;

                                  cursor: pointer;
                                }
                              }
                              .fullDeleteBtn {
                                width: 100%;
                              }
                            }
                            input {
                              border: 1px solid rgba(211, 211, 211, 1);
                              padding: 0.3em;
                            }
                          `}
                        >
                          <div className="gifts">
                            <div>
                              <input
                                type="text"
                                value={gift.giftName}
                                placeholder="사은품 이름 입력"
                                onChange={(e) =>
                                  handleGiftChange(
                                    fieldIndex,
                                    giftIndex,
                                    "giftName",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                value={gift.giftSkuCode}
                                placeholder="SKU 코드 입력"
                                onChange={(e) =>
                                  handleGiftChange(
                                    fieldIndex,
                                    giftIndex,
                                    "giftSkuCode",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                value={
                                  gift.giftQty === null ||
                                  gift.giftQty === undefined
                                    ? ""
                                    : gift.giftQty
                                }
                                placeholder="수량 입력(숫자)"
                                onChange={(e) =>
                                  handleGiftChange(
                                    fieldIndex,
                                    giftIndex,
                                    "giftQty",
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <div className="giftDeleteBtnDiv">
                              {fields.length && field.gifts.length !== 1 ? (
                                <input
                                  className="giftDeleteBtn"
                                  type="button"
                                  value="-"
                                  onClick={() =>
                                    deleteGift(fieldIndex, giftIndex)
                                  }
                                />
                              ) : (
                                <></>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div
                      className={css`
                        width: 100%;
                        .addBtn {
                          width: 100%;
                          border: 1px solid lightgrey;
                          background: white;
                          padding: 0.3em;
                          cursor: pointer;
                        }
                      `}
                    >
                      <input
                        className="addBtn"
                        type="button"
                        value="+"
                        onClick={() => addGift(fieldIndex)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div
        className={css`
          text-align: center;
          height: 12%;
          padding: 0.6em 0.4em;
          button {
            width: 10em;
            padding: 0.7em 0.5em;
            margin: 0px 0.3em;
            margin-bottom: 0.5em;
            background: black;
            color: white;
            border-radius: 7px;
          }
        `}
      >
        <button onClick={handleReset}>초기화</button>
        <button onClick={handleSave}>저장하기</button>
        <button onClick={handleFileSave}>지급조건 파일 저장</button>
        <button onClick={handleFileLoad}>지급조건 불러오기</button>
      </div>
    </div>
  );
};

export default Convert;

export const getStaticProps: GetStaticProps = async ({ locale }: any) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["header", "convert"], null, [
        "ko",
        "en",
      ])),
    },
  };
};
