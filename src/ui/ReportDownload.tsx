import {useEffect, useRef, useState} from 'react';
export const ReportDownload = ({id, label = '下载报告'}: {id: string; label?: string}) => {
  const [started, setStarted] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return <a className="report-download" href={`/reports/${id}.md`} download onClick={() => {
    setStarted(true); clearTimeout(timer.current); timer.current = setTimeout(() => setStarted(false), 2400);
  }}><svg width="16" height="18" viewBox="0 0 16 18" fill="none" aria-hidden="true"><path d="M9 1H2v16h12V6L9 1Zm0 0v5h5M8 8v6m-3-3 3 3 3-3" stroke="currentColor" strokeLinejoin="round" /></svg><span aria-live="polite">{started ? '已开始下载' : label}</span></a>;
};
