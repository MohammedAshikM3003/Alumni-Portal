import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';


function PageTitleManager() {
  const location = useLocation();

  useEffect(() => {
    const { pathname } = location;

    if (pathname.startsWith('/admin')) {
      document.title = `Admin`;
      return;
    }

    if (pathname.startsWith('/coordinator')) {
      document.title = `Coordinator`;
      return;
    }

    if (pathname.startsWith('/alumini')) {
      document.title = `Alumini`;
      return;
    }

  }, [location.pathname]);

  return null;
}

export default PageTitleManager;
