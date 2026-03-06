from backend.auth import ROLE_PERMISSIONS 
 
def test_stakeholder_read_only(): 
    assert \"read\" in ROLE_PERMISSIONS[\"stakeholder\"] 
    assert \"create_task\" not in ROLE_PERMISSIONS[\"stakeholder\"] 
    assert \"manage_members\" not in ROLE_PERMISSIONS[\"stakeholder\"] 
 
def test_project_manager_work_access(): 
    assert \"create_task\" in ROLE_PERMISSIONS[\"project_manager\"] 
    assert \"delete_task\" in ROLE_PERMISSIONS[\"project_manager\"] 
    assert \"manage_members\" not in ROLE_PERMISSIONS[\"project_manager\"] 
 
def test_manager_full_control(): 
    assert \"manage_members\" in ROLE_PERMISSIONS[\"manager\"] 
    assert "delete_project" in ROLE_PERMISSIONS["manager"]
