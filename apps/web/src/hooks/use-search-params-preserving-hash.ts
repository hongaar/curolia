import { useCallback, useLayoutEffect, useRef } from "react";
import {
  createSearchParams,
  useLocation,
  useNavigate,
  useSearchParams,
  type NavigateOptions,
  type URLSearchParamsInit,
} from "react-router-dom";

export function locationWithPreservedHash(
  pathname: string,
  searchParams: URLSearchParams,
  hash: string,
): { pathname: string; search: string; hash: string } {
  const q = searchParams.toString();
  return {
    pathname,
    search: q ? `?${q}` : "",
    hash,
  };
}

/**
 * Like `useSearchParams`, but `setSearchParams` keeps the current hash.
 * React Router's setter navigates to `"?" + params`, which drops the fragment.
 */
export function useSearchParamsPreservingHash() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const pathnameRef = useRef(location.pathname);
  const hashRef = useRef(location.hash);
  useLayoutEffect(() => {
    pathnameRef.current = location.pathname;
    hashRef.current = location.hash;
  });

  const setSearchParams = useCallback(
    (
      nextInit?:
        | URLSearchParamsInit
        | ((prev: URLSearchParams) => URLSearchParamsInit),
      navigateOpts?: NavigateOptions,
    ) => {
      const next = createSearchParams(
        typeof nextInit === "function"
          ? nextInit(new URLSearchParams(searchParams))
          : nextInit,
      );
      navigate(
        locationWithPreservedHash(pathnameRef.current, next, hashRef.current),
        navigateOpts,
      );
    },
    [navigate, searchParams],
  );

  return [searchParams, setSearchParams] as const;
}
