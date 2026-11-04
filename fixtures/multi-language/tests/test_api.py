import pytest

@pytest.mark.skip(reason="flaky")
def test_a():
    assert True
